export function getConditionFieldGroups(pageFields) {
  return [
    {
      title: "Data Sources",
      items: pageFields.filter(
        f => f.type === "current_user" || f.type === "search"
      ),
    },
    {
      title: "Elements",
      items: pageFields.filter(
        f =>
          f.type === "element" &&
          ["input", "dropdown", "select", "checkbox", "filter"]
            .includes(f.elementType)
      ),
    },
  ];
}
