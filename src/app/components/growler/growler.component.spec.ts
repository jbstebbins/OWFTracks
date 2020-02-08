import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GrowlerComponent } from './growler.component';

describe('GrowlerComponent', () => {
  let component: GrowlerComponent;
  let fixture: ComponentFixture<GrowlerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GrowlerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GrowlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
