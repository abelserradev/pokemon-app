import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ModalConfig {
  isVisible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  showCancelButton: boolean;
  confirmText: string;
  cancelText: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalConfigSubject = new BehaviorSubject<ModalConfig>({
    isVisible: false,
    title: '',
    message: '',
    type: 'info',
    showCancelButton: false,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar'
  });

  public modalConfig$ = this.modalConfigSubject.asObservable();

  showSuccess(message: string, title: string = '¡Éxito!'): void {
    this.show({
      title,
      message,
      type: 'success',
      showCancelButton: false,
      confirmText: 'Aceptar',
      cancelText: 'Cancelar'
    });
  }

  showError(message: string, title: string = 'Error'): void {
    this.show({
      title,
      message,
      type: 'error',
      showCancelButton: false,
      confirmText: 'Aceptar',
      cancelText: 'Cancelar'
    });
  }

  showWarning(message: string, title: string = 'Advertencia'): void {
    this.show({
      title,
      message,
      type: 'warning',
      showCancelButton: false,
      confirmText: 'Aceptar',
      cancelText: 'Cancelar'
    });
  }

  showInfo(message: string, title: string = 'Información'): void {
    this.show({
      title,
      message,
      type: 'info',
      showCancelButton: false,
      confirmText: 'Aceptar',
      cancelText: 'Cancelar'
    });
  }

  showConfirm(
    message: string, 
    title: string = 'Confirmar',
    onConfirm?: () => void,
    onCancel?: () => void
  ): void {
    this.show({
      title,
      message,
      type: 'warning',
      showCancelButton: true,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm,
      onCancel
    });
  }

  private show(config: Partial<ModalConfig>): void {
    this.modalConfigSubject.next({
      ...this.modalConfigSubject.value,
      ...config,
      isVisible: true
    });
  }

  hide(): void {
    const currentConfig = this.modalConfigSubject.value;
    this.modalConfigSubject.next({
      ...currentConfig,
      isVisible: false,
      onConfirm: undefined,
      onCancel: undefined
    });
  }

  confirm(): void {
    const config = this.modalConfigSubject.value;
    const callback = config.onConfirm;
    
    // Limpiar callbacks inmediatamente
    this.clearCallbacks();
    this.hide();
    
    // Ejecutar callback después de cerrar el modal
    if (callback) {
      setTimeout(() => callback(), 100);
    }
  }

  cancel(): void {
    const config = this.modalConfigSubject.value;
    const callback = config.onCancel;
    
    // Limpiar callbacks inmediatamente
    this.clearCallbacks();
    this.hide();
    
    // Ejecutar callback después de cerrar el modal
    if (callback) {
      setTimeout(() => callback(), 100);
    }
  }

  private clearCallbacks(): void {
    const currentConfig = this.modalConfigSubject.value;
    this.modalConfigSubject.next({
      ...currentConfig,
      onConfirm: undefined,
      onCancel: undefined
    });
  }
}

