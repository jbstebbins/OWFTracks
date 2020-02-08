import { TestBed } from '@angular/core/testing';

import { MapMessagesService } from './map-messages.service';

describe('MapMessagesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MapMessagesService = TestBed.get(MapMessagesService);
    expect(service).toBeTruthy();
  });
});
