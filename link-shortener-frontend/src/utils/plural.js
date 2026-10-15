export function pluralize(count, [one, few, many]) {
  const mod10 = count % 10
  const mod100 = count % 100
  let word = many
  if (mod10 === 1 && mod100 !== 11) word = one
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = few
  return `${count} ${word}`
}
