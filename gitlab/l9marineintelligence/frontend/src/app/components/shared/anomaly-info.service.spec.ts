import { TestBed } from '@angular/core/testing';

import { AnomalyInfoService } from './anomaly-info.service';

describe('AnomalyInfoService', () => {
  let service: AnomalyInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnomalyInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
