import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StageService } from '../../services/stage.service';
import { PaceNotesService } from '../../../pace-notes/services/pace-notes.service';
import { NoteGroupService } from '../../../pace-notes/services/note-group.service';
import { RallyService } from '../../../rallies/services/rally.service';
import { PaceNote } from '../../../../core/models/pace-note.model';
import { Rally } from '../../../../core/models/rally.model';

interface NoteSegment {
  notes: PaceNote[];
  isSuperset: boolean;
}

interface PrintPage {
  segments: NoteSegment[];
  pageIndex: number;
  breakNoteId: string | null;
}

const DEFAULT_SIZE = 96;
const MIN_SIZE = 20;
const MAX_SIZE = 200;
const SIZE_STEP = 8;
const DEFAULT_POSITION = 33; // % left column (0-100)
const DEFAULT_GAP = 12; // px padding between center col and side cols
const MIN_GAP = 0;
const MAX_GAP = 80;

@Component({
  selector: 'app-stage-print',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (stage()) {
      <div class="print-wrapper">

        <div class="screen-controls">
          <div class="screen-header">
            <h1>{{ rally()?.name }} — {{ stage()!.name }}</h1>
            <span class="screen-date">{{ currentDate | date:'dd/MM/yyyy' }}</span>
          </div>

          <div class="screen-actions">
            <button (click)="print()" class="btn-print">Imprimir</button>
            <button (click)="close()" class="btn-close">Tancar</button>
          </div>
        </div>

        @for (page of pages(); track page.pageIndex) {
          <div class="page">
            <div class="page-header">
              <span class="page-rally">{{ rally()?.name }}</span>
              <span class="page-stage">{{ stage()!.name }}</span>
              <span class="page-number">{{ page.pageIndex + 1 }}/{{ pages().length }}</span>
            </div>

            @if (page.breakNoteId) {
              <div class="break-banner" (click)="toggleBreak(page.breakNoteId)" title="Clic per eliminar el salt">
                <span>✂ salt de pàgina — clic per eliminar</span>
              </div>
            }

            @for (segment of page.segments; track $index) {
              <div [class]="segmentWrapperClass(segment)">
                @for (note of segment.notes; track note.id; let last = $last) {
                  <div class="note-block">
                    <div class="note-toolbar">
                      <div class="size-group">
                        <span class="size-label">Esq</span>
                        <button class="sz-btn" (click)="changeSize(note, 'noteBeforeSize', -SIZE_STEP)">−</button>
                        <span class="sz-val">{{ note.noteBeforeSize ?? DEFAULT_SIZE }}</span>
                        <button class="sz-btn" (click)="changeSize(note, 'noteBeforeSize', +SIZE_STEP)">+</button>
                      </div>
                      <div class="size-group">
                        <span class="size-label">Dre</span>
                        <button class="sz-btn" (click)="changeSize(note, 'noteAfterSize', -SIZE_STEP)">−</button>
                        <span class="sz-val">{{ note.noteAfterSize ?? DEFAULT_SIZE }}</span>
                        <button class="sz-btn" (click)="changeSize(note, 'noteAfterSize', +SIZE_STEP)">+</button>
                      </div>
                      <div class="size-group size-group--pos">
                        <span class="size-label">Pos</span>
                        <input
                          type="range" min="0" max="100" step="1"
                          [ngModel]="note.notePosition ?? DEFAULT_POSITION"
                          (ngModelChange)="changePosition(note, $event)"
                          class="pos-slider"
                        />
                        <span class="sz-val">{{ note.notePosition ?? DEFAULT_POSITION }}%</span>
                      </div>
                      <div class="size-group size-group--pos">
                        <span class="size-label">ME</span>
                        <input
                          type="range" [min]="0" [max]="80" step="2"
                          [ngModel]="note.noteGapLeft ?? DEFAULT_GAP"
                          (ngModelChange)="changeGap(note, 'noteGapLeft', $event)"
                          class="pos-slider"
                        />
                        <span class="sz-val">{{ note.noteGapLeft ?? DEFAULT_GAP }}px</span>
                      </div>
                      <div class="size-group size-group--pos">
                        <span class="size-label">MD</span>
                        <input
                          type="range" [min]="0" [max]="80" step="2"
                          [ngModel]="note.noteGapRight ?? DEFAULT_GAP"
                          (ngModelChange)="changeGap(note, 'noteGapRight', $event)"
                          class="pos-slider"
                        />
                        <span class="sz-val">{{ note.noteGapRight ?? DEFAULT_GAP }}px</span>
                      </div>
                    </div>

                    <div class="note-row" [style.gridTemplateColumns]="noteGridCols(note)">
                      <div
                        class="col col--left"
                        contenteditable="true"
                        (blur)="saveFieldDiv(note, 'noteBefore', $event)"
                        [textContent]="note.noteBefore || ''"
                        data-placeholder="esq."
                        [style.fontSize.px]="note.noteBeforeSize ?? DEFAULT_SIZE"
                      ></div>

                      <div class="col col--center"
                        [style.paddingLeft.px]="note.noteGapLeft ?? DEFAULT_GAP"
                        [style.paddingRight.px]="note.noteGapRight ?? DEFAULT_GAP"
                      >
                        @if (note.type === 'curve') {
                          <span class="note-label">{{ note.noteLabel || '—' }}</span>
                        } @else {
                          <span class="note-label">{{ categorizeStraight(note.distance) }}</span>
                        }
                      </div>

                      <div
                        class="col col--right"
                        contenteditable="true"
                        (blur)="saveFieldDiv(note, 'noteAfter', $event)"
                        [textContent]="note.noteAfter || ''"
                        data-placeholder="dre."
                        [style.fontSize.px]="note.noteAfterSize ?? DEFAULT_SIZE"
                      ></div>
                    </div>

                  </div>

                  @if ((!segment.isSuperset && !last) || (segment.isSuperset && last && hasNotesAfter(note))) {
                    <div
                      class="page-break-divider"
                      [class.active]="note.pageBreakAfter"
                      (click)="toggleBreak(note.id)"
                      title="{{ note.pageBreakAfter ? 'Treure salt de pàgina' : 'Inserir salt de pàgina' }}"
                    >
                      <span class="divider-label">{{ note.pageBreakAfter ? '✂ salt de pàgina' : '+ salt de pàgina' }}</span>
                    </div>
                  }
                }
              </div>
            }
          </div>
        }

      </div>
    } @else {
      <div class="loading-screen">Carregant notes...</div>
    }
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Playfair Display', Georgia, serif;
    }

    /* ── Screen controls ── */
    .screen-controls {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      background: #1e293b;
      color: white;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .screen-header { display: flex; flex-direction: column; gap: 2px; }
    .screen-header h1 { margin: 0; font-size: 17px; font-family: sans-serif; }
    .screen-date { font-size: 12px; opacity: 0.6; font-family: sans-serif; }

    .screen-actions { display: flex; align-items: center; gap: 10px; }
    .btn-print {
      background: #2563eb; color: white; border: none;
      padding: 8px 20px; border-radius: 6px; cursor: pointer;
      font-size: 14px; font-weight: 600; font-family: sans-serif;
    }
    .btn-print:hover { background: #1d4ed8; }
    .btn-close {
      background: #475569; color: white; border: none;
      padding: 8px 16px; border-radius: 6px; cursor: pointer;
      font-size: 14px; font-family: sans-serif;
    }
    .btn-close:hover { background: #334155; }

    /* ── Print wrapper ── */
    .print-wrapper { padding-top: 68px; background: #f1f5f9; min-height: 100vh; }

    /* ── Page ── */
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 24px;
      padding-top: 12mm;
      padding-right: 16mm;
      padding-bottom: 14mm;
      padding-left: 16mm;
      background: white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }
    .page-rally { font-size: 14px; font-weight: 600; color: #475569; flex: 1; min-width: 0; }
    .page-stage { font-size: 16px; font-weight: 700; color: #0f172a; flex: 1; text-align: center; min-width: 0; }
    .page-number {
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1;
      flex: 0 0 auto;
      text-align: right;
    }

    /* ── Break banner: shown at top of pages caused by a manual break ── */
    .break-banner {
      font-family: sans-serif;
      font-size: 11px;
      color: #2563eb;
      background: #eff6ff;
      border: 1px dashed #93c5fd;
      border-radius: 4px;
      padding: 4px 10px;
      margin-bottom: 4px;
      cursor: pointer;
      text-align: center;
      flex-shrink: 0;
      user-select: none;
    }
    .break-banner:hover {
      background: #dbeafe;
      border-color: #2563eb;
    }

    /* ── Page break divider (screen only) ── */
    .page-break-divider {
      display: flex;
      align-items: center;
      height: 12px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      position: relative;
      margin: 0 -16mm;
      padding: 0 16mm;
    }
    .page-break-divider::before {
      content: '';
      flex: 1;
      height: 1px;
      background: #cbd5e1;
      transition: background 0.15s, height 0.15s;
    }
    .page-break-divider:hover,
    .page-break-divider.active {
      opacity: 1;
    }
    .page-break-divider.active::before {
      background: #2563eb;
      height: 2px;
    }
    .page-break-divider:hover:not(.active)::before {
      background: #94a3b8;
    }
    .divider-label {
      font-family: sans-serif;
      font-size: 10px;
      white-space: nowrap;
      padding: 0 8px;
      color: #94a3b8;
      user-select: none;
    }
    .page-break-divider.active .divider-label {
      color: #2563eb;
      font-weight: 600;
    }
    .note-block:hover + .page-break-divider,
    .page-break-divider:hover {
      opacity: 1;
    }

    /* ── Segment wrapper (propagate flex to children) ── */
    .segment-normal {
      display: contents;
    }

    /* ── Superset: rectangle vermell que engloba el grup ── */
    .superset-block {
      position: relative;
      border: 6px solid #dc2626;
      border-radius: 6px;
      margin: 4px 0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    /*
     * «Més velocitat»: segona línia vermella a fora del rectangle (esquerra),
     * amb buit respecte la vora exterior del marc.
     */
    .superset-block--faster {
      overflow: visible;
      margin-left: 32px;
    }
    .superset-block--faster::before {
      content: '';
      position: absolute;
      /* 6px vora + ~14px buit + 8px ralla (des de la vora interior del contingut) */
      left: -28px;
      top: 6px;
      bottom: 6px;
      width: 8px;
      background: #dc2626;
      border-radius: 3px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      pointer-events: none;
    }
    .superset-block .note-block {
      flex: 1;
    }
    .superset-block .note-block:last-child {
      border-bottom: none;
    }

    /* ── Note block ── */
    .note-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border-bottom: 1px solid #e2e8f0;
      position: relative;
    }
    .note-block:last-child { border-bottom: none; }

    /* ── Per-note toolbar (screen only) ── */
    .note-toolbar {
      display: none;
      position: absolute;
      top: 4px; right: 0;
      gap: 12px;
      background: #1e293b;
      border-radius: 6px;
      padding: 4px 10px;
      z-index: 10;
      font-family: sans-serif;
    }
    .note-block:hover .note-toolbar { display: flex; }

    .size-group {
      display: flex;
      align-items: center;
      gap: 4px;
      color: white;
    }
    .size-label { font-size: 11px; opacity: 0.65; }
    .sz-btn {
      background: #334155; color: white; border: none;
      width: 22px; height: 22px; border-radius: 4px;
      cursor: pointer; font-size: 16px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      padding: 0;
    }
    .sz-btn:hover { background: #2563eb; }
    .sz-val { font-size: 12px; font-weight: 600; min-width: 28px; text-align: center; }
    .size-group--pos { gap: 6px; }
    .pos-slider { width: 80px; accent-color: #2563eb; cursor: pointer; }

    /* ── Note row: columnes dinàmiques per nota ── */
    .note-row {
      display: grid;
      align-items: center;
      width: 100%;
    }

    .col--center {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .note-label {
      font-size: 96px; font-weight: 900; line-height: 1;
      letter-spacing: -3px; color: #0f172a; text-align: center;
    }

    .col--left,
    .col--right {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 900; line-height: 1;
      letter-spacing: -3px; color: #0f172a;
      padding: 8px;
      min-height: 1.2em;
      outline: none;
      border-radius: 4px;
      word-break: break-all;
      /* font-size ve del [style] inline */
    }
    .col--left  { text-align: right; border-right: 1px solid #e2e8f0; }
    .col--right { text-align: left;  border-left:  1px solid #e2e8f0; }

    .col--left:hover,  .col--right:hover  { background: #f1f5f9; }
    .col--left:focus,  .col--right:focus  { background: #f8fafc; outline: 1px dashed #94a3b8; }

    .col--left:empty:not(:focus)::before {
      content: attr(data-placeholder);
      color: #d1d5db; font-size: 18px; font-weight: 400; letter-spacing: 0; font-style: italic;
    }
    .col--right:empty:not(:focus)::before {
      content: attr(data-placeholder);
      color: #d1d5db; font-size: 18px; font-weight: 400; letter-spacing: 0; font-style: italic;
    }

    .loading-screen {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; font-size: 20px; color: #64748b;
    }

    /* ── Print ── */
    @media print {
      @page { size: A4 portrait; margin: 0; }
      :host, html, body { margin: 0; padding: 0; background: white; }

      .screen-controls { display: none !important; }
      .note-toolbar { display: none !important; }
      .page-break-divider { display: none !important; }
      .break-banner { display: none !important; }
      .print-wrapper { padding-top: 0; background: white; }

      .page {
        box-shadow: none; margin: 0; width: 100%;
        height: 297mm; min-height: unset;
        padding-top: 16mm;
        page-break-after: always; break-after: page;
      }
      .page:last-child { page-break-after: avoid; break-after: avoid; }

      .col--left::before, .col--right::before { display: none !important; }
      .col--left:empty  { border-right-color: transparent; }
      .col--right:empty { border-left-color:  transparent; }

      .page-number { font-size: 32px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `]
})
export class StagePrintComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private stageService = inject(StageService);
  private paceNotesService = inject(PaceNotesService);
  private noteGroupService = inject(NoteGroupService);
  private rallyService = inject(RallyService);
  private originalTitle = document.title;

  readonly DEFAULT_SIZE = DEFAULT_SIZE;
  readonly DEFAULT_POSITION = DEFAULT_POSITION;
  readonly DEFAULT_GAP = DEFAULT_GAP;
  readonly SIZE_STEP = SIZE_STEP;

  stage = this.stageService.currentStage;
  rally = signal<Rally | null>(null);
  currentDate = new Date();

  pages = signal<PrintPage[]>([]);

  noteGridCols(note: PaceNote): string {
    const pos = note.notePosition ?? DEFAULT_POSITION;
    const right = 100 - pos;
    return `${pos}fr auto ${right}fr`;
  }

  /** Classes del wrapper del segmente: agrupació + línia interior si alguna nota és «més velocitat». */
  segmentWrapperClass(segment: NoteSegment): string {
    if (!segment.isSuperset) return 'segment-normal';
    const anyFaster = segment.notes.some(n => n.fasterCall);
    return anyFaster ? 'superset-block superset-block--faster' : 'superset-block';
  }

  /** True if this note is not the last in stage order (divider / break after it can matter). */
  hasNotesAfter(note: PaceNote): boolean {
    const list = this.paceNotesService.notes();
    const i = list.findIndex(n => n.id === note.id);
    return i >= 0 && i < list.length - 1;
  }

  async ngOnInit() {
    this.loadFont();
    const stageId = this.route.snapshot.paramMap.get('id');
    if (!stageId) return;

    const stage = await this.stageService.getStageById(stageId);
    this.stageService.currentStage.set(stage);

    if (stage) {
      const [, , rally] = await Promise.all([
        this.paceNotesService.loadNotesByStage(stageId),
        this.noteGroupService.loadByStage(stageId),
        this.rallyService.getRallyById(stage.rallyId),
      ]);
      this.rally.set(rally);
      this.buildPages();
      if (rally) document.title = `${rally.name} - ${stage.name}`;
    }
  }

  ngOnDestroy(): void {
    document.title = this.originalTitle;
  }

  toggleBreak(noteId: string): void {
    const note = this.paceNotesService.notes().find(n => n.id === noteId);
    if (!note) return;
    const pageBreakAfter = !note.pageBreakAfter;
    const updated = { ...note, pageBreakAfter };
    this.paceNotesService.notes.set(
      this.paceNotesService.notes().map(n => (n.id === noteId ? updated : n))
    );
    this.buildPages();
    void this.paceNotesService.updateNote({ id: noteId, pageBreakAfter });
  }

  changePosition(note: PaceNote, value: number): void {
    if (value === (note.notePosition ?? DEFAULT_POSITION)) return;
    this.updateNote(note, { notePosition: value });
  }

  changeGap(note: PaceNote, field: 'noteGapLeft' | 'noteGapRight', value: number): void {
    const clamped = Math.min(MAX_GAP, Math.max(MIN_GAP, value));
    if (clamped === (note[field] ?? DEFAULT_GAP)) return;
    this.updateNote(note, { [field]: clamped });
  }

  changeSize(note: PaceNote, field: 'noteBeforeSize' | 'noteAfterSize', delta: number): void {
    const current = note[field] ?? DEFAULT_SIZE;
    const next = Math.min(MAX_SIZE, Math.max(MIN_SIZE, current + delta));
    if (next === current) return;
    this.updateNote(note, { [field]: next });
  }

  saveFieldDiv(note: PaceNote, field: 'noteBefore' | 'noteAfter', event: Event): void {
    const value = (event.target as HTMLElement).textContent?.trim() ?? '';
    if (value === (note[field] ?? '')) return;
    this.updateNote(note, { [field]: value });
  }

  private updateNote(note: PaceNote, patch: Partial<PaceNote>): void {
    const updated = { ...note, ...patch };
    this.paceNotesService.notes.set(
      this.paceNotesService.notes().map(n => n.id === note.id ? updated : n)
    );
    this.buildPages();
    this.paceNotesService.updateNote({ id: note.id, ...patch });
  }

  private buildPages(): void {
    const notes = this.paceNotesService.notes();
    const breaks = new Set(notes.filter(n => n.pageBreakAfter).map(n => n.id));
    const pages: PrintPage[] = [];

    // Build segments of consecutive same-group notes
    const segments: NoteSegment[] = [];
    for (const note of notes) {
      const last = segments[segments.length - 1];
      const noteGroupId = note.groupId ?? null;
      const isSuperset = noteGroupId !== null;

      if (last && last.isSuperset === isSuperset && (noteGroupId === null || last.notes[0].groupId === noteGroupId)) {
        last.notes.push(note);
      } else {
        segments.push({ notes: [note], isSuperset });
      }
    }

    let currentSegments: NoteSegment[] = [];
    let pendingBreakNoteId: string | null = null;
    let pageIndex = 0;

    const flush = (breakNoteId: string | null = null) => {
      if (currentSegments.length > 0) {
        pages.push({ segments: currentSegments, pageIndex: pageIndex++, breakNoteId: pendingBreakNoteId });
        currentSegments = [];
        pendingBreakNoteId = breakNoteId;
      }
    };

    for (let si = 0; si < segments.length; si++) {
      const seg = segments[si];
      if (!seg.isSuperset) {
        let sliceStart = 0;
        for (let i = 0; i < seg.notes.length; i++) {
          const note = seg.notes[i];
          if (breaks.has(note.id) && i < seg.notes.length - 1) {
            currentSegments.push({ notes: seg.notes.slice(sliceStart, i + 1), isSuperset: false });
            flush(note.id);
            sliceStart = i + 1;
          }
        }
        const remaining = seg.notes.slice(sliceStart);
        if (remaining.length > 0) {
          currentSegments.push({ notes: remaining, isSuperset: false });
        }
      } else {
        currentSegments.push(seg);
        const lastNote = seg.notes[seg.notes.length - 1];
        if (breaks.has(lastNote.id) && si < segments.length - 1) {
          flush(lastNote.id);
        }
      }
    }

    flush();

    this.pages.set(pages);
  }

  private loadFont(): void {
    const id = 'playfair-display-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap';
    document.head.appendChild(link);

    const styleId = 'print-global-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `@media print { @page { size: A4 portrait; margin: 0; } body { margin: 0 !important; padding: 0 !important; } }`;
    document.head.appendChild(style);
  }

  print(): void { window.print(); }
  close(): void { window.close(); }

  categorizeStraight(distance: number | undefined): string {
    if (!distance) return '25';
    if (distance <= 37) return '25';
    if (distance <= 75) return '50';
    if (distance <= 125) return '100';
    if (distance <= 175) return '150';
    return '150';
  }
}
