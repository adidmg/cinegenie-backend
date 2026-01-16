import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { error } from 'console';
import { QueryPlan } from './query.interface';
import { QUERY_JSON_SCHEMA } from './query.schema';

@Injectable()
export class GeminiApiService {
  private readonly geminiClient: GoogleGenAI;
  private readonly MOVIE_SCHEMA_CONTEXT: string = `
  TABLE: movies
    - movie_id (UUID, PK)
    - poster_link (VARCHAR(200))
    - series_title (VARCHAR(100)) // Use this for movie titles
    - released_year (INT4)
    - certificate (VARCHAR(10))
    - runtime (INT2) // Duration in minutes
    - imdb_rating (FLOAT4)
    - overview (VARCHAR(2500))
    - director (VARCHAR(50))
    - star1 (VARCHAR(50))
    - star2 (VARCHAR(50))
    - star3 (VARCHAR(50))
    - star4 (VARCHAR(50))
    
    TABLE:genres
        -genre_id (UUID,PK)
        -genre (VARCHAR(20))
    
    JOIN TABLE: movie_genres
        -movie_id (UUID, FK to movies.movie_id)
        -genre (UUID,FK to genres.genre_id)

    REALTIONSHIPS:
    - movies.movie_id joins to movie_genres.movie_id
    - genres.genre_id joins to movie_genres.genre_id

    INSTRUCTIONS:
    - Use the exact table and column names (e.g., movies.series_title, genres.name).
    - If filtering by genre name, you MUST join through the movie_genres table.
  `;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new error('GEMINI_API_KEY is not set in configuration');
    }
    this.geminiClient = new GoogleGenAI({ apiKey });
  }
  async getMovieQueryPlan(userQuery: string): Promise<QueryPlan> {
    const prompt = `
    ### ROLE AND INSTRUCTION ###
      You are an expert SQL Query Planner. Your SOLE task is to analyze the User Query and the Database Schema, then generate a JSON object that strictly conforms to the provided JSON Schema. Do NOT output any additional text or commentary. Output RAW JSON only.
      The main table, 'movies', is aliased as 'm'.
     **CRITICAL:** All column references for the 'movies' table **MUST** use the alias **m** (e.g., m.series_title, m.director, m.star1).
     * **Filters on different database fields MUST use the 'AND' logical operator.**
        * Example: Director AND Genre (e.g., "Nolan's action movies")
        * Example: Rating AND Year (e.g., "movies after 2010 with rating > 8")
     * **Filters on multiple columns representing the SAME concept MUST use the 'OR' logical operator.**
     *      When a user queries for an **Actor's Name** (e.g., "movies with Bale"), you MUST generate **FOUR** separate conditions in the 'where' array, connected by the **'OR'** logical operator.
        * Example: Star1 OR Star2 OR Star3 OR Star4 (e.g., "movies with Christian Bale")
  
     IMPLICIT RATING/QUALITY FILTERS:
    * If the user uses vague terms like "good," "best," "high-rated," or "top," translate this into a single, concrete IMDb rating filter (m.imdb_rating). Use the '>' operator with a threshold of 7.5.
    * **DO NOT create redundant or repetitive rating conditions** (e.g., avoid outputting conditions for > 7, >= 7.5, and > 8 in the same query).
    
    LANGUAGE RELATED:
    * if the user asks "suggest some french movies" perform a web search obtain movie titles around 50 and generate a query if such titles exist in the database
    USER TONE:
    *Analyse user tone,for example, "I'm sad suggest some movies" analyse the user tone and try to suggest some funny movies

     The value of the 'operator' field MUST ONLY be one of the following exact SQL symbols: =, >, <, >=, <=, or LIKE.
    - DO NOT include quotes, escape codes (like \u0022), or extra characters in the 'operator' value.

      ### DATABASE SCHEMA ###
      ${this.MOVIE_SCHEMA_CONTEXT}
      
      ### CONVERSION RULES ###
      1. Joins: If a filter requires information from 'genres', include 'movie_genres' and 'genres' in the 'joins' array. Use aliases 'mg' and 'g'.
      2. Where: Use fully qualified column names (e.g., movies.series_title).
      3. Order By: Convert sorting requests (e.g., "highest rated") into the 'order_by' object.

      ### USER QUERY TO CONVERT ###
      Convert this query into the QueryPlan JSON: "${userQuery}"`;

    const response = await this.geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: QUERY_JSON_SCHEMA,
      },
    });
    return JSON.parse(response.text) as QueryPlan;
  }
}
