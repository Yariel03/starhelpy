import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span
      class="badge"
      [style.background-color]="badgeConfig().color"
    >
      {{ badgeConfig().name }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-block;
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
  `],
})
export class BadgeComponent {
  level = input.required<number>();

  badgeConfig() {
    switch (this.level()) {
      case 0:
        return { name: 'Normal', color: '#2e7d32' };
      case 1:
        return { name: 'Attention', color: '#f9a825' };
      case 2:
        return { name: 'Alert', color: '#c62828' };
      default:
        return { name: 'No data', color: '#757575' };
    }
  }
}
