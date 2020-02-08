import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CotMinotaurComponent } from './cot-minotaur.component';

describe('CotMinotaurComponent', () => {
  let component: CotMinotaurComponent;
  let fixture: ComponentFixture<CotMinotaurComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CotMinotaurComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CotMinotaurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
