const EXCLUDED_USER_FIELDS = ["email", "platformUserId", "slug"];

export function getEditableUserFieldsFromDatatype(datatype) {
  if (!datatype || !datatype.fields) return [];

  return datatype.fields
    .filter((field) => {
      const key = field.name.toLowerCase();
      return (
        !EXCLUDED_USER_FIELDS.includes(field.name) &&
        !key.includes("password") &&
        !key.includes("created") &&
        !key.includes("modified")
      );
    })
    .map((field) => ({
      name: field.name,
      label: field.name, // you can prettify later
    }));
}
