import { useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface SubscriptionOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  enabled?: boolean;
}

/**
 * Hook for real-time Supabase subscriptions
 * Handles subscription lifecycle and cleanup
 * 
 * @param table - Table name to subscribe to
 * @param onPayload - Callback when data changes
 * @param options - Subscription options
 */
export function useRealtimeSubscription<T>(
  table: string,
  onPayload: (payload: T) => void,
  options: SubscriptionOptions = {}
) {
  const { event = '*', schema = 'public', enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !table) return;

    // Create subscription channel
    const channel = supabase
      .channel(`${schema}.${table}`)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
        },
        (payload: any) => {
          onPayload(payload.new || payload.old);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`📡 Subscribed to ${table}`);
        }
      });

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, onPayload, event, schema, enabled]);

  // Manual unsubscribe method
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}

/**
 * Hook for monitoring a specific entity and its changes
 * @param table - Table name
 * @param entityId - The ID of the entity to monitor
 * @param onUpdate - Callback when entity updates
 */
export function useRealtimeEntity<T extends { id: string }>(
  table: string,
  entityId: string | null | undefined,
  onUpdate: (entity: T) => void
) {
  return useRealtimeSubscription(
    table,
    (payload: T) => {
      if (payload.id === entityId) {
        onUpdate(payload);
      }
    },
    { enabled: !!entityId }
  );
}

/**
 * Hook for monitoring a filtered set of entities
 * @param table - Table name
 * @param filter - Optional filter function
 * @param onUpdate - Callback when any matching entity updates
 */
export function useRealtimeFilter<T extends { id: string }>(
  table: string,
  filter: (entity: T) => boolean,
  onUpdate: (entity: T) => void
) {
  return useRealtimeSubscription(
    table,
    (payload: T) => {
      if (filter(payload)) {
        onUpdate(payload);
      }
    }
  );
}
