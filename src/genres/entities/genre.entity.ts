import { Movie } from 'src/movies/entities/movie.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  genre_id: string;

  @Column('varchar', { length: 20 })
  genre: string;

  @ManyToMany(() => Movie, (movie) => movie.genres)
  movies: Movie[];
}
