-- Add new fields to processes table for TEAM, TREM and PT process types
ALTER TABLE public.processes 
ADD COLUMN material TEXT,
ADD COLUMN nomeado BOOLEAN DEFAULT false,
ADD COLUMN numero_boletim_nomeado TEXT,
ADD COLUMN recebido BOOLEAN DEFAULT false,
ADD COLUMN publicado BOOLEAN DEFAULT false,
ADD COLUMN numero_boletim_publicado TEXT,
ADD COLUMN matriz_analise BOOLEAN DEFAULT false,
ADD COLUMN encaminhado BOOLEAN DEFAULT false,
ADD COLUMN data_encaminhamento DATE;