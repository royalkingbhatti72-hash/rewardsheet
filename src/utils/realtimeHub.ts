import { supabase, supabaseAnonKey } from './supabase';
import { api } from '../api/client';

export type LiveEventType = 'spin' | 'task' | 'wallet' | 'notification' | 'command' | 'all';

class RealtimeHub {
  private activeChannel: any = null;
  private currentUserId: string | null = null;
  private heartbeatTimer: any = null;
  private isInitialized = false;

  public init(userId: string) {
    if (!userId) return;
    if (this.currentUserId === userId && this.isInitialized && (this.activeChannel || this.heartbeatTimer)) {
      return;
    }

    this.cleanup();
    this.currentUserId = userId;
    this.isInitialized = true;

    // Supabase Realtime WebSocket endpoint requires a legacy JWT token (eyJ...)
    // If only a publishable key (sb_publishable_...) is provided, avoid the failing websocket connection
    const hasValidRealtimeToken = typeof supabaseAnonKey === 'string' && supabaseAnonKey.startsWith('eyJ');

    if (hasValidRealtimeToken) {
      try {
        const channelName = `royal_live_user_${userId}`;
        this.activeChannel = supabase
          .channel(channelName)
        // 1. Listen to Notifications (created by admin for approvals of all kinds)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Notification', filter: `userId=eq.${userId}` },
          (payload) => {
            this.broadcast('notification', payload);
          }
        )
        // 2. Listen to Spin Entitlements (when admin approves milestone spin or grants spin)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'UserSpinEntitlement', filter: `userId=eq.${userId}` },
          (payload) => {
            this.broadcast('spin', payload);
          }
        )
        // 3. Listen to Wallet Balance Changes (when task reward, deposit, or withdrawal is processed)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Wallet', filter: `userId=eq.${userId}` },
          (payload) => {
            this.broadcast('wallet', payload);
          }
        )
        // 4. Listen to Task Submissions (approved / rejected by admin)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'TaskSubmission', filter: `userId=eq.${userId}` },
          (payload) => {
            this.broadcast('task', payload);
          }
        )
        // 5. Listen to UserTaskProgress
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'UserTaskProgress', filter: `userId=eq.${userId}` },
          (payload) => {
            this.broadcast('task', payload);
          }
        )
        // 6. Direct real-time broadcast commands sent from backend/admin
        .on('broadcast', { event: 'live_command' }, ({ payload }) => {
          if (!payload?.targetUserId || payload.targetUserId === userId) {
            this.broadcast(payload?.commandType || 'command', payload);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Connected to Supabase Realtime WebSocket
          }
        });
      } catch (err) {
        console.warn('[RealtimeHub] Realtime subscription init notice:', err);
      }
    }

    // High-speed fallback heartbeat sync: checks for new data every 6s if window is active
    this.startHeartbeatSync();
  }

  private startHeartbeatSync() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && this.currentUserId) {
        // Broadcast silent heartbeat for active pages to fetch fresh Supabase data
        window.dispatchEvent(
          new CustomEvent('royal_live_heartbeat', {
            detail: { userId: this.currentUserId, timestamp: Date.now() },
          })
        );
      }
    }, 10000);
  }

  public broadcast(type: LiveEventType, payload?: any) {
    // Invalidate browser memory/session caches
    api.invalidateCache();

    // Fire custom event for any listening page / part to update without reloading
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('royal_live_update', {
          detail: { type, payload, timestamp: Date.now() },
        })
      );
    }
  }

  public cleanup() {
    if (this.activeChannel) {
      try {
        supabase.removeChannel(this.activeChannel);
      } catch (_) {}
      this.activeChannel = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.currentUserId = null;
    this.isInitialized = false;
  }
}

export const realtimeHub = new RealtimeHub();
