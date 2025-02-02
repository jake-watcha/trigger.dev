export function fileNameFromTitleCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s-]+/g, "-")
    .toLowerCase();
}

export function TitleCaseWithSpaces(str: string) {
  if (!str) {
    return "";
  }

  if (!str.match(/([a-z])([A-Z])/g)) {
    //capitalize the first letter
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[\s-]+/g, " ")
    .replace(/^./, function (str: string) {
      return str.toUpperCase();
    });
}

export function toFriendlyTypeName(original: string) {
  //convert the input string to TitleCase, strip out any non alpha characters and strip out spaces
  return original
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, function (str: string) {
      return str.toUpperCase();
    })
    .replace(/[^a-zA-Z]/g, "")
    .replace(/\s/g, "");
}
