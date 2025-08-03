
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (data?: Partial<CreateTodoInput>) => {
  const todoData = {
    title: 'Test Todo',
    description: 'A todo for testing',
    ...data
  };

  const result = await db.insert(todosTable)
    .values(todoData)
    .returning()
    .execute();

  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    const todo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual(todo.description);
    expect(result.completed).toEqual(todo.completed);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });

  it('should update todo description', async () => {
    const todo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual(todo.title);
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(todo.completed);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });

  it('should update todo completed status', async () => {
    const todo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual(todo.title);
    expect(result.description).toEqual(todo.description);
    expect(result.completed).toEqual(true);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });

  it('should update multiple fields', async () => {
    const todo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'New Title',
      description: 'New description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.completed).toEqual(true);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });

  it('should set description to null', async () => {
    const todo = await createTestTodo({ description: 'Some description' });
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual(todo.title);
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(todo.completed);
  });

  it('should save updated todo to database', async () => {
    const todo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Database Updated Title',
      completed: true
    };

    await updateTodo(updateInput);

    const updatedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo.id))
      .execute();

    expect(updatedTodos).toHaveLength(1);
    expect(updatedTodos[0].title).toEqual('Database Updated Title');
    expect(updatedTodos[0].completed).toEqual(true);
    expect(updatedTodos[0].updated_at).toBeInstanceOf(Date);
    expect(updatedTodos[0].updated_at > todo.updated_at).toBe(true);
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 99999,
      title: 'Non-existent todo'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/todo with id 99999 not found/i);
  });

  it('should only update updated_at when no other fields provided', async () => {
    const todo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todo.id
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual(todo.title);
    expect(result.description).toEqual(todo.description);
    expect(result.completed).toEqual(todo.completed);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });
});
