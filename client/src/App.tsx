
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit2, Plus, CheckCircle2, Circle } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  // Explicit typing with Todo interface
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Form state with proper typing for nullable fields
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null // Explicitly null, not undefined
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState<UpdateTodoInput>({
    id: 0,
    title: '',
    description: null
  });

  // useCallback to memoize function used in useEffect
  const loadTodos = useCallback(async () => {
    try {
      // NOTE: Backend handlers are stubs - they return empty array or placeholder data
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      // NOTE: Backend handler is a stub - returns placeholder data
      const response = await trpc.createTodo.mutate(formData);
      // Update todos list with explicit typing in setState callback
      setTodos((prev: Todo[]) => [...prev, response]);
      // Reset form
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title?.trim() || !editingTodo) return;
    
    setIsLoading(true);
    try {
      // NOTE: Backend handler is a stub - returns placeholder data
      const response = await trpc.updateTodo.mutate(editFormData);
      // Update todos list
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => todo.id === editingTodo.id ? response : todo)
      );
      setEditingTodo(null);
      setEditFormData({ id: 0, title: '', description: null });
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      // NOTE: Backend handler is a stub - returns placeholder data
      await trpc.toggleTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      // Update todos list optimistically since stub doesn't return proper data
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === todo.id ? { ...t, completed: !t.completed } : t)
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      // NOTE: Backend handler is a stub - always returns success
      await trpc.deleteTodo.mutate({ id: todoId });
      // Remove from todos list
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditFormData({
      id: todo.id,
      title: todo.title,
      description: todo.description
    });
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setEditFormData({ id: 0, title: '', description: null });
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          {totalCount > 0 && (
            <div className="flex justify-center gap-4 mt-4">
              <Badge variant="outline" className="text-sm">
                📝 Total: {totalCount}
              </Badge>
              <Badge variant="outline" className="text-sm">
                ✅ Completed: {completedCount}
              </Badge>
              <Badge variant="outline" className="text-sm">
                ⏳ Remaining: {totalCount - completedCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Add New Todo
            </CardTitle>
            <CardDescription>Create a new task to keep track of your goals</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <Input
                placeholder="What needs to be done? 🎯"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg"
              />
              <Textarea
                placeholder="Add a description (optional) 📝"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Creating...' : '✨ Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todos List */}
        {todos.length === 0 ? (
          <Card className="text-center py-12 shadow-lg">
            <CardContent>
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No todos yet!</h3>
              <p className="text-gray-500">Create your first todo above to get started.</p>
              <p className="text-sm text-amber-600 mt-4 bg-amber-50 p-3 rounded-md border border-amber-200">
                ⚠️ Note: This app uses stub backend handlers, so data won't persist between page refreshes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todos.map((todo: Todo) => (
              <Card key={todo.id} className={`shadow-md transition-all duration-200 hover:shadow-lg ${
                todo.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}>
                <CardContent className="p-6">
                  {editingTodo?.id === todo.id ? (
                    // Edit Form
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <Input
                        value={editFormData.title || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditFormData((prev: UpdateTodoInput) => ({ ...prev, title: e.target.value }))
                        }
                        required
                        className="text-lg"
                      />
                      <Textarea
                        value={editFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEditFormData((prev: UpdateTodoInput) => ({
                            ...prev,
                            description: e.target.value || null
                          }))
                        }
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isLoading} size="sm">
                          {isLoading ? 'Saving...' : '💾 Save'}
                        </Button>
                        <Button type="button" variant="outline" onClick={cancelEdit} size="sm">
                          ❌ Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Display Todo
                    <>
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleToggleComplete(todo)}
                          className="mt-1 flex-shrink-0 transition-colors duration-200"
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-lg font-semibold ${
                            todo.completed 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-800'
                          }`}>
                            {todo.title}
                          </h3>
                          
                          {todo.description && (
                            <p className={`mt-2 ${
                              todo.completed 
                                ? 'line-through text-gray-400' 
                                : 'text-gray-600'
                            }`}>
                              {todo.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-gray-400">
                              📅 Created: {todo.created_at.toLocaleDateString()}
                            </span>
                            {todo.completed && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                ✅ Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-shrink-0">
                          {!todo.completed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(todo)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(todo.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {/* Progress Summary */}
            {totalCount > 0 && (
              <>
                <Separator className="my-6" />
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl mb-2">
                      {completedCount === totalCount ? '🎉' : '💪'}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {completedCount === totalCount 
                        ? 'All tasks completed! Great job!' 
                        : `${completedCount} of ${totalCount} tasks completed`
                      }
                    </h3>
                    {completedCount < totalCount && (
                      <p className="text-gray-600 mt-1">Keep going, you're doing great! 🚀</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
