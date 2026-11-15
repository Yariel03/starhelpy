import { Component, inject, input } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

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
  private readonly i18n = inject(I18nService);
  level = input.required<number>();

  badgeConfig() {
    const t = this.i18n.t();
    switch (this.level()) {
      case 0:
        return { name: t.badge_normal, color: '#2e7d32' };
      case 1:
        return { name: t.badge_attention, color: '#f9a825' };
      case 2:
        return { name: t.badge_alert, color: '#c62828' };
      default:
        return { name: t.badge_nodata, color: '#757575' };
    }
  }
}
