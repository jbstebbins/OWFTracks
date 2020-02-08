import { TestBed } from '@angular/core/testing';

import { ActionNotificationService } from './action-notification.service';

describe('ActionNotificationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ActionNotificationService = TestBed.get(ActionNotificationService);
    expect(service).toBeTruthy();
  });
});
