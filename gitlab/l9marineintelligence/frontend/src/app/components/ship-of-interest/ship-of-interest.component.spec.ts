import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipOfInterestComponent } from './ship-of-interest.component';

describe('ShipOfInterestComponent', () => {
  let component: ShipOfInterestComponent;
  let fixture: ComponentFixture<ShipOfInterestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShipOfInterestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipOfInterestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
