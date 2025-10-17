import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class ModalComponent {
  @Input() isVisible = false;
  @Input() title = '';
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'success';
  @Input() showCancelButton = false;
  @Input() confirmText = 'Aceptar';
  @Input() cancelText = 'Cancelar';
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isProcessing = false;

  onConfirm(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    this.confirmed.emit();
    this.close();
    
    // Resetear el flag después de un delay
    setTimeout(() => {
      this.isProcessing = false;
    }, 1000);
  }

  onCancel(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    this.cancelled.emit();
    this.close();
    
    // Resetear el flag después de un delay
    setTimeout(() => {
      this.isProcessing = false;
    }, 1000);
  }

  close(): void {
    if (this.isProcessing) return;
    
    this.isVisible = false;
    this.closed.emit();
  }

  getIconByType(): string {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[this.type];
  }
}

