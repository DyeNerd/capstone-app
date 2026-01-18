import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Rally } from './Rally';

@Entity('rally_events')
export class RallyEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Rally, rally => rally.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rally_id' })
  rally!: Rally;

  @Column({ type: 'varchar', nullable: false })
  event_type!: 'SHOT' | 'IDLE' | 'HIT' | 'LAND';

  @Column({ type: 'integer', nullable: false })
  event_sequence!: number;

  @Column({ type: 'timestamp', nullable: false })
  timestamp!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  position_x?: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  position_y?: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  position_z?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  velocity_kmh?: number;

  @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true })
  confidence?: number;

  @CreateDateColumn()
  created_at!: Date;
}

