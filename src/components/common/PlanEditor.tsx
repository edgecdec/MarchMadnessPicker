"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Box, TextField, IconButton, Checkbox, Typography, Paper, Button, Snackbar, Alert } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { api } from "@/lib/api";

interface Task {
  text: string;
  done: boolean;
}

export default function PlanEditor() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [snack, setSnack] = useState("");
  const [dirty, setDirty] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  useEffect(() => {
    api.admin.getPlan().then((d) => setTasks(d.tasks)).catch(() => {});
  }, []);

  const save = useCallback(async (t: Task[]) => {
    try {
      await api.admin.savePlan(t);
      setSnack("Plan saved!");
      setDirty(false);
    } catch (e: any) {
      setSnack(e.message);
    }
  }, []);

  const update = (fn: (prev: Task[]) => Task[]) => {
    setTasks((prev) => {
      const next = fn(prev);
      setDirty(true);
      return next;
    });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    update((prev) => [...prev, { text: newTask.trim(), done: false }]);
    setNewTask("");
  };

  const toggleDone = (i: number) => {
    update((prev) => prev.map((t, j) => (j === i ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (i: number) => {
    update((prev) => prev.filter((_, j) => j !== i));
  };

  const editText = (i: number, text: string) => {
    update((prev) => prev.map((t, j) => (j === i ? { ...t, text } : t)));
  };

  const handleDragStart = (i: number) => { dragItem.current = i; };
  const handleDragEnter = (i: number) => { dragOver.current = i; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return;
    update((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(dragItem.current!, 1);
      copy.splice(dragOver.current!, 0, item);
      return copy;
    });
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Development Plan</Typography>
        <Button variant="contained" size="small" onClick={() => save(tasks)} disabled={!dirty}>
          Save Plan
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        Top = highest priority. Drag to reorder. The AI agent picks the top incomplete task each loop.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {tasks.map((task, i) => (
          <Box
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              p: 0.5,
              borderRadius: 1,
              background: task.done ? "rgba(76,175,80,0.08)" : "rgba(255,255,255,0.03)",
              opacity: task.done ? 0.6 : 1,
              cursor: "grab",
              "&:hover": { background: "rgba(255,255,255,0.06)" },
              "&:active": { cursor: "grabbing" },
            }}
          >
            <DragIndicatorIcon sx={{ color: "#555", fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: "#666", minWidth: 20 }}>#{i + 1}</Typography>
            <Checkbox size="small" checked={task.done} onChange={() => toggleDone(i)} sx={{ p: 0.25 }} />
            <TextField
              size="small"
              fullWidth
              value={task.text}
              onChange={(e) => editText(i, e.target.value)}
              variant="standard"
              InputProps={{ disableUnderline: true, sx: { fontSize: "0.85rem", textDecoration: task.done ? "line-through" : "none" } }}
            />
            <IconButton size="small" onClick={() => deleteTask(i)} sx={{ color: "#666" }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <IconButton onClick={addTask} color="primary"><AddIcon /></IconButton>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack("")}>
        <Alert severity="success" onClose={() => setSnack("")}>{snack}</Alert>
      </Snackbar>
    </Paper>
  );
}
