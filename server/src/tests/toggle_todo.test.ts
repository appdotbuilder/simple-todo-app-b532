
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput, type CreateTodoInput } from '../schema';
import { toggleTodo } from '../handlers/toggle_todo';
import { eq } from 'drizzle-orm';

// Test input for creating a todo
const testTodoInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
};

describe('toggleTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle todo from incomplete to complete', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testTodoInput.title,
        description: testTodoInput.description,
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Toggle to complete
    const toggleInput: ToggleTodoInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await toggleTodo(toggleInput);

    // Verify the result
    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should toggle todo from complete to incomplete', async () => {
    // Create a completed todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testTodoInput.title,
        description: testTodoInput.description,
        completed: true
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Toggle to incomplete
    const toggleInput: ToggleTodoInput = {
      id: createdTodo.id,
      completed: false
    };

    const result = await toggleTodo(toggleInput);

    // Verify the result
    expect(result.id).toEqual(createdTodo.id);
    expect(result.completed).toBe(false);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should update the todo in database', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testTodoInput.title,
        description: testTodoInput.description,
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Toggle to complete
    const toggleInput: ToggleTodoInput = {
      id: createdTodo.id,
      completed: true
    };

    await toggleTodo(toggleInput);

    // Query the database to verify the update
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should throw error for non-existent todo', async () => {
    const toggleInput: ToggleTodoInput = {
      id: 999,
      completed: true
    };

    await expect(toggleTodo(toggleInput)).rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should handle null description correctly', async () => {
    // Create a todo with null description
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Todo without description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];

    // Toggle to complete
    const toggleInput: ToggleTodoInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await toggleTodo(toggleInput);

    expect(result.description).toBeNull();
    expect(result.completed).toBe(true);
  });
});
