import { useState } from "react"; // React hook for state management
import { Sun, Moon } from "lucide-react"; // Icons for theme toggle
import Calendar from "./components/Calendar"; // Import Calendar component

function App() {
  // State to manage dark theme (defaults to true)
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Function to toggle between dark and light themes
  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-gray-900" : "bg-white"}`}>
      {/* Theme Toggle Button */}
      <div className="flex justify-end p-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${
            isDarkTheme ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          {isDarkTheme ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>

      {/* Calendar Container */}
      <div className=" mx-auto p-4 lg:p-8">
        <Calendar isDarkTheme={isDarkTheme} />
      </div>
    </div>
  );
}

export default App;