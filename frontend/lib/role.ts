export function ehProfessor(role?: string): boolean {
  return role === 'PROFESSOR' || role === 'ADMIN';
}

export function ehAdmin(role?: string): boolean {
  return role === 'ADMIN';
}
