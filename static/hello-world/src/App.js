import React, { useEffect, useState, useCallback } from "react";
import { events, invoke, view } from "@forge/bridge";
import "./App.css";

// Enable theming and auto-resizing
view.theme.enable();

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch checklist data
  const fetchChecklist = useCallback(async () => {
    try {
      const data = await invoke("getChecklist");
      setItems(data?.items || []);
    } catch (error) {
      console.error("Failed to fetch checklist", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChecklist();

    // Refresh if Jira issue changes
    const subscription = events.on("JIRA_ISSUE_CHANGED", () => {
      fetchChecklist();
    });

    return () => {
      subscription.then((sub) => sub.unsubscribe());
    };
  }, [fetchChecklist]);

  // Save changes to backend
  const saveChecklistData = async (newItems) => {
    setSaving(true);
    setItems(newItems); // Optimistic UI update

    try {
      await invoke("saveChecklist", { data: { items: newItems } });
    } catch (error) {
      console.error("Failed to save checklist", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCheck = (id) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );
    saveChecklistData(newItems);
  };

  const handleDelete = (id) => {
    const newItems = items.filter((item) => item.id !== id);
    saveChecklistData(newItems);
  };

  const handleAddItem = (e) => {
    if (e.key === "Enter" && newItemText.trim() !== "") {
      const newItem = {
        id: Date.now().toString() + Math.random().toString(),
        text: newItemText.trim(),
        checked: false,
      };
      saveChecklistData([...items, newItem]);
      setNewItemText("");
    }
  };

  if (loading) {
    return <div className="loading-container">Loading checklist...</div>;
  }

  const completedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;
  const progressPercentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="checklist-container">
      <div className="checklist-header">
        <div>Hellllo</div>
        <div className="checklist-title-area">
          {totalCount > 0 && (
            <span className="checklist-progress-text">
              {progressPercentage}% Complete
            </span>
          )}
        </div>
        <button className="manage-btn">
          <span>⚙</span> Manage
        </button>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="checklist-items">
        {items.map((item) => {
          // Check for #URGENT in text
          const isUrgent = item.text.toLowerCase().includes("#urgent");
          const displayText = item.text.replace(/#urgent/gi, "").trim();

          return (
            <div key={item.id} className="checklist-item">
              <input
                type="checkbox"
                className="item-checkbox"
                checked={item.checked}
                onChange={() => handleToggleCheck(item.id)}
              />
              <span className={`item-text ${item.checked ? "checked" : ""}`}>
                {displayText}
              </span>

              {item.checked && <span className="item-tag done">DONE</span>}
              {!item.checked && isUrgent && (
                <span className="item-tag urgent">URGENT</span>
              )}

              <button
                className="item-delete-btn"
                onClick={() => handleDelete(item.id)}
                title="Delete item"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <div className="add-item-container">
        <span className="add-item-plus">+</span>
        <input
          type="text"
          className="add-item-input"
          placeholder="Add an item... (Press Enter to save, use #URGENT for badge)"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleAddItem}
          disabled={saving}
        />
      </div>
    </div>
  );
}

export default App;
