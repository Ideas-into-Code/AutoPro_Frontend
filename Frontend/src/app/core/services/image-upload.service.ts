import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';

import { API_CONFIG, buildServiceUrl } from '../config/api.config';

interface BackendUpload {
  secureUrl: string;
  url: string;
}

/**
 * Téléversement d'images vers le stockage (Cloudinary via `/api/files/image`).
 *
 * Dans `core` : plusieurs features en ont besoin (photo de panne jointe à une
 * demande, photo de profil du mécanicien) et une feature n'en importe jamais
 * une autre.
 */
@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  /** Téléverse une image et renvoie son URL. */
  upload(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file, file.name);
    // Aucun en-tête `Content-Type` : le navigateur pose la frontière multipart.
    return this.http
      .post<BackendUpload>(buildServiceUrl(this.config, 'files', 'image'), form)
      .pipe(map((r) => r.secureUrl || r.url));
  }

  /** Téléverse plusieurs images en parallèle, renvoie leurs URLs dans l'ordre. */
  uploadAll(files: readonly File[]): Observable<string[]> {
    if (files.length === 0) {
      return of([]);
    }
    return forkJoin(files.map((f) => this.upload(f)));
  }
}
