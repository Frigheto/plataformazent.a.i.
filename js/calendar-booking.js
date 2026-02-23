/**
 * Calendar Booking Module (Simplified)
 * External calendar booking via EasyWorkHub link
 * Link: https://link.easyworkhub.com.br/widget/booking/NUFajWLkKkScPcVtQ88b
 */

class CalendarBooking {
  constructor() {
    this.bookingUrl = 'https://link.easyworkhub.com.br/widget/booking/NUFajWLkKkScPcVtQ88b';
    console.log('CalendarBooking initialized successfully');
    console.log('Booking URL:', this.bookingUrl);
  }

  /**
   * Get booking URL
   */
  getBookingUrl() {
    return this.bookingUrl;
  }
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.calendarBooking = new CalendarBooking();
  });
} else {
  window.calendarBooking = new CalendarBooking();
}
