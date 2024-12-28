'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useToast } from '@/hooks/use-toast'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import { Check, Copy, Edit2, MoreVertical, Plus, PlusCircle, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Task {
    id: string
    content: string
}

interface Column {
    id: string
    title: string
    tasks: Task[]
}

const initialData: { [key: string]: Column } = {
    todo: {
        id: 'todo',
        title: 'To Do',
        tasks: [
            { id: 'task-1', content: 'Start my chemistry assignment' },
              { id: 'task-2', content: 'Finish up my mathmetics homework' }
        ],
    },
    inProgress: {
        id: 'inProgress',
        title: 'In Progress',
        tasks: [
            { id: 'task-3', content: 'Prepare for my history presentation' },
        ],
    },
    done: {
        id: 'done',
        title: 'Done',
        tasks: [
            { id: 'task-4', content: 'Complete my english homework' },
        ],
    },
}

export default function KanbanBoard() {
    const [columns, setColumns] = useState<{ [key: string]: Column }>({})
    const [newColumnTitle, setNewColumnTitle] = useState('')
    const [newTaskContent, setNewTaskContent] = useState('')
    const [editingTask, setEditingTask] = useState<{ columnId: string, taskId: string } | null>(null)
    const [editedTaskContent, setEditedTaskContent] = useState('')
    const [showAddTask, setShowAddTask] = useState<string | null>(null)

    const { toast } = useToast()

    useEffect(() => {
        const savedColumns = localStorage.getItem('eLearningKanbanColumns')
        if (savedColumns) {
            setColumns(JSON.parse(savedColumns))
        } else {
            setColumns(initialData)
        }
    }, [setColumns])

    useEffect(() => {
        localStorage.setItem('eLearningKanbanColumns', JSON.stringify(columns))
    }, [columns])

    const onDragEnd = (result: DropResult) => {
        const { destination, source } = result

        if (!destination) {
            return
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        const start = columns[source.droppableId]
        const finish = columns[destination.droppableId]

        if (start === finish) {
            const newTasks = Array.from(start.tasks)
            const [reorderedItem] = newTasks.splice(source.index, 1)
            newTasks.splice(destination.index, 0, reorderedItem)

            const newColumn = {
                ...start,
                tasks: newTasks,
            }

            setColumns({
                ...columns,
                [newColumn.id]: newColumn,
            })

            toast({
                description: `Task moved within ${start.title}`,
            })
        } else {
            const startTasks = Array.from(start.tasks)
            const [movedItem] = startTasks.splice(source.index, 1)
            const newStart = {
                ...start,
                tasks: startTasks,
            }

            const finishTasks = Array.from(finish.tasks)
            finishTasks.splice(destination.index, 0, movedItem)
            const newFinish = {
                ...finish,
                tasks: finishTasks,
            }

            setColumns({
                ...columns,
                [newStart.id]: newStart,
                [newFinish.id]: newFinish,
            })

            toast({
                description: `Task moved from ${start.title} to ${finish.title}`,
            })
        }
    }

    const addColumn = () => {
        if (newColumnTitle.trim() !== '') {
            const newColumnId = `column-${Date.now()}`
            setColumns({
                ...columns,
                [newColumnId]: {
                    id: newColumnId,
                    title: newColumnTitle,
                    tasks: [],
                },
            })
            setNewColumnTitle('')
            toast({
                description: `New column "${newColumnTitle}" added`,
            })
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Column title cannot be empty",
            })
        }
    }

    const addTask = (columnId: string) => {
        if (newTaskContent.trim() !== '') {
            const newTask = {
                id: `task-${Date.now()}`,
                content: newTaskContent,
            }
            setColumns({
                ...columns,
                [columnId]: {
                    ...columns[columnId],
                    tasks: [...columns[columnId].tasks, newTask],
                },
            })

            setNewTaskContent('')

            toast({
                description: `New task added to ${columns[columnId].title}`,
            })
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Task content cannot be empty",
            })
        }
    }

    const deleteTask = (columnId: string, taskId: string) => {
        const newTasks = columns[columnId].tasks.filter(task => task.id !== taskId)
        setColumns({
            ...columns,
            [columnId]: {
                ...columns[columnId],
                tasks: newTasks,
            },
        })
        toast({
            description: `Task deleted from ${columns[columnId].title}`,
        })
    }

    const deleteColumn = (columnId: string) => {
        const newColumns = { ...columns }
        const deletedColumnTitle = newColumns[columnId].title
        delete newColumns[columnId]
        setColumns(newColumns)
        toast({
            description: `Column "${deletedColumnTitle}" deleted`,
        })
    }

    const startEditingTask = (columnId: string, taskId: string, currentContent: string) => {
        setEditingTask({ columnId, taskId })
        setEditedTaskContent(currentContent)
    }

    const cancelEditingTask = () => {
        setEditingTask(null)
        setEditedTaskContent('')
        toast({
            description: "Task editing cancelled",
        })
    }

    const saveEditedTask = () => {
        if (editingTask && editedTaskContent.trim() !== '') {
            const { columnId, taskId } = editingTask
            const newTasks = columns[columnId].tasks.map(task =>
                task.id === taskId ? { ...task, content: editedTaskContent } : task
            )
            setColumns({
                ...columns,
                [columnId]: {
                    ...columns[columnId],
                    tasks: newTasks,
                },
            })
            setEditingTask(null)
            setEditedTaskContent('')
            toast({
                description: "Task updated successfully",
            })
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Task content cannot be empty",
            })
        }
    }

    const copyTaskContent = (content: string) => {
        navigator.clipboard.writeText(content).then(() => {
            toast({
                description: 'Task content copied to clipboard',
            })
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to copy task content",
            })
        })
    }

    return (
        <div className="p-4">
            <div className="flex w-full justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Tasks</h1>
                <DropdownMenu >
                    <DropdownMenuTrigger  asChild>
                        <Button variant="outline" className='ml-auto'>
                            <span>Add Column</span>
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-4 space-y-4">
                        <Input
                            type="text"
                            placeholder="New column title"
                            value={newColumnTitle}
                            onChange={(e) => setNewColumnTitle(e.target.value)}
                        />
                        <Button onClick={addColumn} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Column
                        </Button>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <ScrollArea className="w-full h-[calc(100vh-200px)]">
                <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                    <DragDropContext onDragEnd={onDragEnd}>
                        {Object.values(columns).map((column) => (
                            <Card key={column.id} className="p-4 rounded-lg w-80 border-0  ">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-bold text-lg">{column.title}</h2>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => deleteColumn(column.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Column
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => {
                                                setShowAddTask(column.id)
                                                setNewTaskContent('')
                                                document.getElementById(`new-task-input-${column.id}`)?.focus()
                                            }}>
                                                <Plus className="mr-2 h-4 w-4" /> Add New Task
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <ScrollArea className="h-[calc(85vh-320px)]">
                                            <ul
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className={`space-y-2 min-h-[100px] ${snapshot.isDraggingOver ? 'bg-muted rounded-md' : ''}`}
                                            >
                                                {column.tasks.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <li
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`relative  mb-2 transition-all duration-200 ${snapshot.isDragging ? 'z-10 shadow-lg scale-105' : ''
                                                                    }`}
                                                            >
                                                                <Card className={`shadow-md  hover:shadow-lg transition-shadow duration-200 ${snapshot.isDragging ? 'bg-muted' : ' '
                                                                    } `}>
                                                                    <CardContent className="p-4 flex flex-wrap justify-between items-center">
                                                                        {editingTask?.taskId === task.id ? (
                                                                            <div className="flex items-center w-full">
                                                                                <Input
                                                                                    type="text"
                                                                                    value={editedTaskContent}
                                                                                    onChange={(e) => setEditedTaskContent(e.target.value)}
                                                                                    className="mr-2 flex-grow"
                                                                                />
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={saveEditedTask}
                                                                                    className="mr-1"
                                                                                >
                                                                                    <Check className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={cancelEditingTask}
                                                                                >
                                                                                    <X className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <div >
                                                                                <span className="flex-grow mr-2">{task.content}</span>
                                                                                <div className="flex items-center">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => copyTaskContent(task.content)}
                                                                                        className="mr-1"
                                                                                        title="Copy task content"
                                                                                    >
                                                                                        <Copy className="h-4 w-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => startEditingTask(column.id, task.id, task.content)}
                                                                                        className="mr-1"
                                                                                        title="Edit task"
                                                                                    >
                                                                                        <Edit2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => deleteTask(column.id, task.id)}
                                                                                        title="Delete task"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>

                                                            </li>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </ul>
                                        </ScrollArea>
                                    )}
                                </Droppable>
                                {showAddTask === column.id && (
                                    <div className="mt-4 space-y-1">
                                        <Input
                                            id={`new-task-input-${column.id}`}
                                            type="text"
                                            placeholder="New task"
                                            value={newTaskContent}
                                            onChange={(e) => setNewTaskContent(e.target.value)}
                                            className="mb-2"
                                        />
                                        <Button onClick={() => addTask(column.id)} className="w-full">
                                            <Plus className="mr-2 h-4 w-4" /> Add Task
                                        </Button>
                                        <Button onClick={() => setShowAddTask(null)} className="w-full " variant={'ghost'}>
                                            <Check className="mr-2 h-4 w-4" /> Done
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </DragDropContext>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}
