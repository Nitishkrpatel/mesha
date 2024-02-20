import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransmissionAnomalyComponent } from './transmission-anomaly.component';

describe('TransmissionAnomalyComponent', () => {
  let component: TransmissionAnomalyComponent;
  let fixture: ComponentFixture<TransmissionAnomalyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransmissionAnomalyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransmissionAnomalyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
