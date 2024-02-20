import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayHistoryComponent } from './play-history.component';

describe('PlayHistoryComponent', () => {
  let component: PlayHistoryComponent;
  let fixture: ComponentFixture<PlayHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
