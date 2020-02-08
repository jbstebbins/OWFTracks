import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackCoreComponent } from './track-core.component';

describe('TrackCoreComponent', () => {
  let component: TrackCoreComponent;
  let fixture: ComponentFixture<TrackCoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackCoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackCoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
