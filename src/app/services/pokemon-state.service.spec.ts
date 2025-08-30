import { TestBed } from '@angular/core/testing';

import { PokemonStateService } from './pokemon-state.service';

describe('PokemonStateService', () => {
  let service: PokemonStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PokemonStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
