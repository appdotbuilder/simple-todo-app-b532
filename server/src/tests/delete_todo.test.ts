
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput, type CreateTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input for creating todos
const testCreateInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing deletion'
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description
      })
      .returning()
      .execute();
    
    const createdTodo = createResult[0];
    expect(createdTodo.id).toBeDefined();

    // Delete the todo
    const deleteInput: DeleteTodoInput = { id: createdTodo.id };
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(true);
  });

  it('should remove todo from database', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description
      })
      .returning()
      .execute();
    
    const createdTodo = createResult[0];

    // Delete the todo
    const deleteInput: DeleteTodoInput = { id: createdTodo.id };
    await deleteTodo(deleteInput);

    // Verify todo is removed from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false for non-existent todo', async () => {
    const deleteInput: DeleteTodoInput = { id: 99999 }; // Non-existent ID
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple todos
    const todo1Result = await db.insert(todosTable)
      .values({
        title: 'Todo 1',
        description: 'First todo'
      })
      .returning()
      .execute();

    const todo2Result = await db.insert(todosTable)
      .values({
        title: 'Todo 2',
        description: 'Second todo'
      })
      .returning()
      .execute();

    const todo1 = todo1Result[0];
    const todo2 = todo2Result[0];

    // Delete only the first todo
    const deleteInput: DeleteTodoInput = { id: todo1.id };
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(true);

    // Verify first todo is deleted
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo1.id))
      .execute();
    expect(deletedTodos).toHaveLength(0);

    // Verify second todo still exists
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo2.id))
      .execute();
    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
  });

  it('should handle deletion of completed todo', async () => {
    // Create a completed todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'A completed todo',
        completed: true
      })
      .returning()
      .execute();
    
    const createdTodo = createResult[0];

    // Delete the completed todo
    const deleteInput: DeleteTodoInput = { id: createdTodo.id };
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(true);

    // Verify todo is removed
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });
});
