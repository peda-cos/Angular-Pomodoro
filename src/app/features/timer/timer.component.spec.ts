import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimerComponent } from './timer.component';

describe('TimerComponent', () => {
  let component: TimerComponent;
  let fixture: ComponentFixture<TimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display formatted time', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const timeDisplay = compiled.querySelector('.time');
    expect(timeDisplay?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('should have play/pause button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const playButton = compiled.querySelector('.btn-primary');
    expect(playButton).toBeTruthy();
  });

  it('should toggle play/pause on button click', () => {
    spyOn(component, 'togglePlayPause');
    const compiled = fixture.nativeElement as HTMLElement;
    const playButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
    playButton.click();
    expect(component.togglePlayPause).toHaveBeenCalled();
  });
});
