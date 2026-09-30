import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JobIds } from '@/content';
import { createInitialState } from './state';
import { createStore } from './store';

describe('store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('notifies subscribers only when the state changes', () => {
    const store = createStore(createInitialState());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.dispatch({ type: 'LEAVE_BAR' });
    expect(listener).not.toHaveBeenCalled();

    store.dispatch({ type: 'ENTER_BAR' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().phase).toBe('bar');

    unsubscribe();
    store.dispatch({ type: 'LEAVE_BAR' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('autosaves at most once per interval and flushes on demand', () => {
    const persist = vi.fn();
    const store = createStore(createInitialState(), { persist, persistIntervalMs: 1000 });

    store.dispatch({ type: 'ACCEPT_JOB', jobId: JobIds.haldenToMeridian });
    store.dispatch({ type: 'TICK', deltaMs: 100 });
    store.dispatch({ type: 'TICK', deltaMs: 100 });
    expect(persist).not.toHaveBeenCalled();

    vi.advanceTimersByTime(999);
    expect(persist).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenLastCalledWith(store.getState());

    store.dispatch({ type: 'TICK', deltaMs: 100 });
    store.flush();
    expect(persist).toHaveBeenCalledTimes(2);

    store.flush();
    vi.advanceTimersByTime(5000);
    expect(persist).toHaveBeenCalledTimes(2);
  });
});
