/** Descarrega uma tabela como ficheiro CSV. */
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const text = rows.map((r) => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
