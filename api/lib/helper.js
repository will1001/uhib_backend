const incrementCell = async (str, steps = 1) => {
  let result = str;
  while (steps > 0) {
    result = incrementByOne(result);
    steps--;
  }
  return result;
};

const incrementByOne = (str) => {
  if (str === "") return "A"; // Start from 'a' if input is empty

  let index = str.length - 1;
  let endChar = str[index];
  let prefix = str.slice(0, index);

  if (endChar !== "z" && endChar !== "Z") {
    // If the last character is not 'z' or 'Z', just increment this character
    return prefix + String.fromCharCode(endChar.charCodeAt(0) + 1);
  }

  // If the last character is 'z' or 'Z', append 'a' or 'A' respectively after incrementing the rest
  return incrementByOne(prefix) + (endChar === "Z" ? "A" : "A");
};

module.exports = {
  incrementCell,
};
