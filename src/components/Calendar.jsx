import { useState, useEffect } from "react"; // React hooks for state and side effects
import { colors } from "./colors"; // Import predefined colors for events
import React from "react"; // Import React
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  parseISO,
  addDays,
} from "date-fns"; // Date utility functions
import { v4 as uuidv4 } from "uuid"; // UUID generator for unique IDs
import { ChevronLeft, ChevronRight } from "lucide-react"; // Icons for navigation

const Calendar = ({ isDarkTheme }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [nextEventNumber, setNextEventNumber] = useState(() => {
    const savedNumber = localStorage.getItem("nextEventNumber");
    return savedNumber ? parseInt(savedNumber, 10) : 1;
  });
  
  const [resources, setResources] = useState(() => {
    const savedResources = localStorage.getItem("resources");
    return savedResources
      ? JSON.parse(savedResources)
      : Array.from({ length: 6 }, (_, i) => ({
          id: uuidv4(),
          name: `Resource ${i + 1}`,
        }));
  });

  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem("events");
    return savedEvents ? JSON.parse(savedEvents) : [];
  });

  useEffect(() => {
    localStorage.setItem("resources", JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("nextEventNumber", nextEventNumber.toString());
  }, [nextEventNumber]);

  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Function to add a new resource
  const handleAddResource = () => {
    setResources((prevResources) => [
      ...prevResources,
      {
        id: uuidv4(),
        name: `Resource ${prevResources.length + 1}`,
      },
    ]);
  };

  // Function to add a new event
  const handleAddEvent = (date, resourceId) => {
    const newEvent = {
      id: uuidv4(),
      resourceId,
      startDate: format(date, "yyyy-MM-dd"),
      endDate: format(date, "yyyy-MM-dd"),
      title: `Event ${nextEventNumber}`,
      color: colors[(nextEventNumber - 1) % colors.length],
    };
    setEvents([...events, newEvent]);
    setNextEventNumber(prev => prev + 1);
  };

  // Function to assign lanes to events to avoid overlapping
  const assignLanes = (events) => {
    const sortedEvents = [...events].sort((a, b) => {
      const startDiff = parseISO(a.startDate) - parseISO(b.startDate);
      return startDiff !== 0 ? startDiff : a.id.localeCompare(b.id);
    });

    const lanes = [];
    for (const event of sortedEvents) {
      let lane = 0;
      while (
        lanes[lane] &&
        parseISO(event.startDate) <=
          parseISO(lanes[lane][lanes[lane].length - 1].endDate)
      ) {
        lane++;
      }
      if (!lanes[lane]) lanes[lane] = [];
      lanes[lane].push(event);
      event.lane = lane;
    }
    return sortedEvents;
  };

  // Function to handle drag start for events
  const handleDragStart = (e, eventId) => {
    e.dataTransfer.setData("eventId", eventId);
    const dragPreview = document.createElement("div");
    dragPreview.classList.add("bg-opacity-50");
    dragPreview.textContent = "Dragging Event";
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 0, 0);
    setTimeout(() => document.body.removeChild(dragPreview), 0);
  };

  // Function to handle drop events
  const handleDrop = (e, date, resourceId) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    const direction = e.dataTransfer.getData("direction");

    if (direction) {
      handleResizeEnd(eventId, direction, date);
    } else {
      setEvents((prevEvents) =>
        prevEvents.map((event) => {
          if (event.id === eventId) {
            const daysDuration = Math.round(
              (parseISO(event.endDate) - parseISO(event.startDate)) /
                (1000 * 60 * 60 * 24)
            );
            return {
              ...event,
              startDate: format(date, "yyyy-MM-dd"),
              endDate: format(addDays(date, daysDuration), "yyyy-MM-dd"),
              resourceId,
            };
          }
          return event;
        })
      );
    }
  };

  // Function to delete an event
  const handleDeleteEvent = (eventId) => {
    if (window.confirm("Delete this event?")) {
      setEvents(events.filter((event) => event.id !== eventId));
    }
  };

  // Function to handle resize start for events
  const handleResizeStart = (e, eventId, direction) => {
    e.stopPropagation();
    e.dataTransfer.setData("eventId", eventId);
    e.dataTransfer.setData("direction", direction);
  };

  // Function to handle resize end for events
  const handleResizeEnd = (eventId, direction, date) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === eventId) {
          const newDate = format(date, "yyyy-MM-dd");
          if (direction === "left" && newDate <= event.endDate) {
            return { ...event, startDate: newDate };
          }
          if (direction === "right" && newDate >= event.startDate) {
            return { ...event, endDate: newDate };
          }
        }
        return event;
      })
    );
  };

  // Function to navigate between months
  const handleNavigateMonth = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div
      className={`p-4 lg:p-6 rounded-lg shadow-lg ${
        isDarkTheme ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      }`}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigateMonth(-1)}
            className={`p-1 md:p-2 rounded-full ${
              isDarkTheme ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg md:text-xl font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => handleNavigateMonth(1)}
            className={`p-1 md:p-2 rounded-full ${
              isDarkTheme ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Add Resource Button */}
        <button
          onClick={handleAddResource}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm md:text-base"
        >
          Add Resource
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto pb-4">
        <div
          className="grid border-l border-t"
          style={{
            // Add an extra column for the first day of the month
            gridTemplateColumns: `auto repeat(${daysInMonth.length}, minmax(100px, 1fr))`,
            borderColor: isDarkTheme ? "#374151" : "#e5e7eb",
          }}
        >
          {/* Resources Header */}
          <div
            className={`p-3 md:p-4 sticky left-0 z-10 font-semibold min-w-[120px] border-r ${
              isDarkTheme
                ? "bg-gray-800 border-gray-600"
                : "bg-white border-gray-200"
            }`}
          >
            Resources
          </div>

          {/* Days Header */}
          {daysInMonth.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-2 text-center border-r border-b ${
                isDarkTheme
                  ? "bg-gray-800 border-gray-600"
                  : "bg-white border-gray-200"
              } ${isToday(day) ? "bg-blue-100 dark:bg-blue-900" : ""}`}
            >
              <div className="font-semibold">{format(day, "d")}</div>
              <div className="text-xs text-gray-500">{format(day, "EEE")}</div>
            </div>
          ))}

          {/* Resources and Events */}
          {resources.map((resource) => {
            const resourceEvents = events.filter(
              (e) => e.resourceId === resource.id
            );
            const eventsWithLanes = assignLanes(resourceEvents);
            const maxLanes =
              Math.max(...eventsWithLanes.map((e) => e.lane ?? 0), 0) + 1;

            return (
              <React.Fragment key={resource.id}>
                {/* Resource Name */}
                <div
                  className={`p-3 md:p-4 sticky left-0 z-10 border-t min-w-[120px] border-r ${
                    isDarkTheme
                      ? "bg-gray-800 border-gray-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {resource.name}
                </div>

                {/* Days and Events */}
                {daysInMonth.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsWithLanes.filter(
                    (e) => e.startDate <= dayStr && e.endDate >= dayStr
                  );

                  return (
                    <div
                      key={dayStr}
                      className={`min-h-[100px] border-r border-b relative ${
                        isDarkTheme ? "bg-gray-800" : "bg-white"
                      }`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, day, resource.id)}
                      onClick={() => handleAddEvent(day, resource.id)}
                    >
                      <div
                        className="relative"
                        style={{ height: `${maxLanes * 40}px` }}
                      >
                        {/* Render Events */}
                        {dayEvents.map((event) => {
                          const eventStart = parseISO(event.startDate);
                          const eventEnd = parseISO(event.endDate);
                          const daysDuration =
                            Math.round(
                              (eventEnd - eventStart) / (1000 * 60 * 60 * 24)
                            ) + 1;
                          const dayIndex = Math.round(
                            (parseISO(dayStr) - eventStart) /
                              (1000 * 60 * 60 * 24)
                          );
                          const isFirst = dayIndex === 0;
                          const isLast = dayIndex === daysDuration - 1;

                          return (
                            <div
                              key={event.id}
                              className={`absolute ${
                                event.color.startsWith("#") ? "" : event.color
                              } p-2 text-white text-sm cursor-move group`}
                              style={{
                                top: `${event.lane * 40}px`,
                                left: "0",
                                width: "100%",
                                height: "30px",
                                backgroundColor: event.color.startsWith("#")
                                  ? event.color
                                  : undefined,
                                borderRadius:
                                  isFirst && isLast
                                    ? "4px"
                                    : isFirst
                                    ? "4px 0 0 4px"
                                    : isLast
                                    ? "0 4px 4px 0"
                                    : "0",
                                zIndex: 1,
                              }}
                              draggable
                              onDragStart={(e) => handleDragStart(e, event.id)}
                            >
                              {/* Left Resize Handle */}
                              {isFirst && (
                                <div
                                  className="absolute left-0 top-0 h-full w-2 md:w-3 cursor-ew-resize opacity-0 group-hover:opacity-50 bg-white z-20"
                                  draggable
                                  onDragStart={(e) =>
                                    handleResizeStart(e, event.id, "left")
                                  }
                                />
                              )}
                              {/* Right Resize Handle */}
                              {isLast && (
                                <div
                                  className="absolute right-0 top-0 h-full w-2 md:w-3 cursor-ew-resize opacity-0 group-hover:opacity-50 bg-white z-20"
                                  draggable
                                  onDragStart={(e) =>
                                    handleResizeStart(e, event.id, "right")
                                  }
                                />
                              )}

                              {/* Event Title */}
                              {isFirst && (
                                <div className="truncate pointer-events-none text-xs md:text-sm">
                                  {event.title}
                                </div>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event.id);
                                }}
                                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-white hover:text-red-300 p-1"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
