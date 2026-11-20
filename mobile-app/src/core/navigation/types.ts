export type AppTab = 'home' | 'schedules' | 'insights' | 'rewards';

export type AppModal =
  | 'new_focus_session'
  | 'block_list_picker'
  | 'shield_interception'
  | 'paywall'
  | 'settings';

export interface ShieldModalParams {
  appName: string;
  appId?: string;
  reason?: string;
}

export interface NavigationContextValue {
  activeTab: AppTab;
  switchTab: (tab: AppTab) => void;
  activeModal: AppModal | null;
  modalParams: Record<string, unknown> | null;
  openModal: (modal: AppModal, params?: Record<string, unknown>) => void;
  closeModal: () => void;
  presentShield: (params?: ShieldModalParams) => void;
}
