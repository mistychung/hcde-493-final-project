import "./App.css";
import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import format from 'date-fns/format'
import { enUS } from 'date-fns/locale'
import { db } from './firebase'; 
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc 
} from 'firebase/firestore'; 

const localizer = momentLocalizer(moment);

function App() {
  const [assignments, setAssignments] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const [sortByDate, setSortByDate] = useState(false);
  const [sortByClass, setSortByClass] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'assignments'), (querySnapshot) => { 
      const fetchedAssignments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(), 
      }));
      setAssignments(fetchedAssignments); 
    });
  
    return () => unsubscribe(); 
  }, []); 

  const handleCreateAssignment = async () => {
    const newAssignment = {
      name: "", 
      class: "",
      dueDate: "",
      completed: false,
    };
    try {
      await addDoc(collection(db, 'assignments'), newAssignment); 
    } catch (error) {
      console.error("Error saving new assignment:", error);
    }
  };

  const saveAssignmentToFirestore = async (assignment) => {
    try {
      const assignmentRef = doc(db, 'assignments', assignment.id);
      await updateDoc(assignmentRef, {
        name: assignment.name,
        class: assignment.class,
        dueDate: assignment.dueDate,
        completed: assignment.completed,
      });
    } catch (error) {
      console.error("Error saving assignment to Firestore:", error);
    }
  };
  
  const updateAssignment = (id, field, value) => {
    setAssignments((prevAssignments) => {
      const updatedAssignments = prevAssignments.map((assignment) =>
        assignment.id === id ? { ...assignment, [field]: value } : assignment
      );
      const updatedAssignment = updatedAssignments.find((a) => a.id === id);
      saveAssignmentToFirestore(updatedAssignment); 
      return updatedAssignments;
    });
  };

  const handleBlur = (event, id) => {
    const relatedTarget = event.relatedTarget;
    const container = document.getElementById(`assignment-${id}`);

    if (!container.contains(relatedTarget)) {
      setFocusedId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    return format(new Date(date), 'MMMM d, yyyy', { locale: enUS }); 
  };

  const formatDateInput = (date) => {
    if (!date) return "";
    return format(new Date(date), 'yyyy-MM-dd'); 
  };

  const sortAssignments = () => {
    let sortedAssignments = [...assignments];
    if (sortByDate) {
      sortedAssignments = sortedAssignments.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    }
    if (sortByClass) {
      sortedAssignments = sortedAssignments.sort((a, b) => {
        if (!a.class && !b.class) return 0;
        if (!a.class) return 1;
        if (!b.class) return -1;
        return a.class.localeCompare(b.class);
      });
    }
    return sortedAssignments;
  };

  const toggleCompletion = (id) => {
    setAssignments((prevAssignments) =>
      prevAssignments.map((assignment) =>
        assignment.id === id
          ? { ...assignment, completed: !assignment.completed }
          : assignment
      )
    );
      setFocusedId(null);
  };

  const handleDeleteAssignment = (id) => {
    setAssignments(prevAssignments => 
      prevAssignments.filter(assignment => assignment.id !== id)
    );
    setFocusedId(null); 
    deleteDoc(doc(db, 'assignments', id)); 
  };

  const assignmentsToEvents = assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.name || "Untitled Assignment",
    start: assignment.dueDate ? new Date(assignment.dueDate) : null,
    end: assignment.dueDate ? new Date(assignment.dueDate) : null, 
    allDay: true,
  }));

  return (
    <div className="app">
      <div className="list-view">
        <h1 className="title">Assignment Tracker</h1>
        <button className="create-button" onClick={handleCreateAssignment}>
          Create Assignment
        </button>
        <h2 className="subtitle">Current Assignments</h2>
        <div className="sort-buttons">
          <button
            onClick={() => {
              setSortByDate(!sortByDate);
              setSortByClass(false);
            }}
          >
            Sort by Date
          </button>
          <button
            onClick={() => {
              setSortByClass(!sortByClass);
              setSortByDate(false);
            }}
          >
            Sort by Class
          </button>
        </div>
        {sortAssignments()
          .filter((assignment) => !assignment.completed)
          .map((assignment) => (
            <div
              id={`assignment-${assignment.id}`}
              key={assignment.id}
              tabIndex={0}
              className={`assignment-card ${
                focusedId === assignment.id ? "focused" : ""
              }`}
              onClick={() => setFocusedId(assignment.id)}
              onBlur={(e) => handleBlur(e, assignment.id)}
            >
              {/* Only show checkbox if the assignment is not in focus mode */}
              {focusedId !== assignment.id && (
                <input
                  type="checkbox"
                  checked={assignment.completed}
                  onChange={() => toggleCompletion(assignment.id)}
                />
              )}
              {focusedId === assignment.id ? (
                <>
                  <div className="input-group">
                    <span className="label">Name:</span>
                    <input
                      type="text"
                      value={assignment.name}
                      className="input-field"
                      placeholder="Assignment Name"
                      onChange={(e) =>
                        updateAssignment(assignment.id, "name", e.target.value)
                      }
                      autoFocus
                    />
                  </div>
                  <div className="input-group">
                    <span className="label">Class:</span>
                    <input
                      type="text"
                      value={assignment.class}
                      className="input-field"
                      placeholder="Class Name"
                      onChange={(e) =>
                        updateAssignment(assignment.id, "class", e.target.value)
                      }
                    />
                  </div>
                  <div className="input-group">
                    <span className="label">Due Date:</span>
                    <input
                      type="date"
                      value={formatDateInput(assignment.dueDate)}
                      className="input-field"
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        updateAssignment(assignment.id, "dueDate", selectedDate);
                      }}
                    />
                  </div>
                  <button 
                      className="delete-button" 
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                      Delete
                    </button>
                </>
              ) : (
                <>
                  <div className="text-row">
                    <span className="label">Name:</span> {assignment.name}
                  </div>
                  {assignment.class && (
                    <div className="text-row">
                      <span className="label">Class:</span> {assignment.class}
                    </div>
                  )}
                  {assignment.dueDate && (
                    <div className="text-row">
                      <span className="label">Due Date:</span>{" "}
                      {formatDate(assignment.dueDate)} {/* Now formatted as 'September 4, 2024' */}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

        <h2 className="subtitle">Completed Assignments</h2>
        {sortAssignments()
          .filter((assignment) => assignment.completed)
          .map((assignment) => (
            <div
              id={`assignment-${assignment.id}`}
              key={assignment.id}
              tabIndex={0}
              className={`assignment-card ${
                focusedId === assignment.id ? "focused" : ""
              }`}
              onClick={() => setFocusedId(assignment.id)}
              onBlur={(e) => handleBlur(e, assignment.id)}
            >
              {/* Only show checkbox if the assignment is not in focus mode */}
              {focusedId !== assignment.id && (
                <input
                  type="checkbox"
                  checked={assignment.completed}
                  onChange={() => toggleCompletion(assignment.id)}
                />
              )}
              {focusedId === assignment.id ? (
                <>
                  <div className="input-group">
                    <span className="label">Name:</span>
                    <input
                      type="text"
                      value={assignment.name}
                      className="input-field"
                      onChange={(e) =>
                        updateAssignment(assignment.id, "name", e.target.value)
                      }
                      autoFocus
                    />
                  </div>
                  <div className="input-group">
                    <span className="label">Class:</span>
                    <input
                      type="text"
                      value={assignment.class}
                      className="input-field"
                      placeholder="Enter class"
                      onChange={(e) =>
                        updateAssignment(assignment.id, "class", e.target.value)
                      }
                    />
                  </div>
                  <div className="input-group">
                    <span className="label">Due Date:</span>
                    <input
                      type="date"
                      value={formatDateInput(assignment.dueDate)}
                      className="input-field"
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        updateAssignment(assignment.id, "dueDate", selectedDate);
                      }}
                    />
                  </div>
                  <button 
                      className="delete-button" 
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                      Delete
                  </button>
                </>
              ) : (
                <>
                  <div className="text-row">
                    <span className="label">Name:</span> {assignment.name}
                  </div>
                  {assignment.class && (
                    <div className="text-row">
                      <span className="label">Class:</span> {assignment.class}
                    </div>
                  )}
                  {assignment.dueDate && (
                    <div className="text-row">
                      <span className="label">Due Date:</span>{" "}
                      {formatDate(assignment.dueDate)} {/* Now formatted as 'September 4, 2024' */}
                    </div>
                  )}
                </>
              )}
            </div>
        ))}
      </div>
      <div className="calendar-view">
        <Calendar
          localizer={localizer}
          events={assignmentsToEvents.filter((event) => event.start)}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={(event) => {
            setFocusedId(event.id);
          }}
          eventPropGetter={(event) => {
            if (assignments.find((a) => a.id === event.id)?.completed) {
              return { className: "completed-event" };
            }
            return {};
          }}
        />;
      </div>
    </div>
  );
}

export default App;