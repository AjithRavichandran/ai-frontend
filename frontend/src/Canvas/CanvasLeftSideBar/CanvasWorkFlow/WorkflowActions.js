import React from "react";

export default function WorkflowActions({
  wf,
  wfIndex,
  addAction,
  removeAction,
  updateAction,
  setActionPanel,
  availableFields,
 getWorkflowSelectableElements,
pages,
 tree,
 datatypes,
}) {
  return (
    <div className="section-card">
      <div className="section-title">Actions</div>

      {wf.actions.length > 0 ? (
        <div className="space-y-3">
          {wf.actions.map((action, j) => (
            <div
              key={action.id}
              className="border border-gray-200 bg-gray-50 rounded-xl p-4 shadow-sm flex flex-col gap-3 cursor-pointer"
              onClick={() =>
                setActionPanel({
                  open: true,
                  wfIndex,
                  actionIndex: j,
                  context: {
     availableFields,
     pages,
     tree,
     datatypes,
     pageId: wf.pageId,
   },
                })
              }
            >
              {/* Header row */}
              <div className="flex justify-between items-center gap-2">
                {/* Category */}
                <select
  value={action.category || ""}
  onClick={(e) => e.stopPropagation()} // stop parent click
  onChange={(e) => {


    updateAction(wfIndex, j, {
      ...action,
      category: e.target.value,
    });
  }}
>

                  <option value="">Select category</option>
                  <option value="account">Account</option>
                  <option value="navigation">Navigation</option>
                  <option value="data">Data (Things)</option>
                  <option value="element">Element</option>
                </select>

                {/* Remove */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAction(wfIndex, j);
                  }}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Remove
                </button>
              </div>

              {/* Action Type */}
              <select
  value={action.actionType || ""}
  onClick={(e) => e.stopPropagation()} // stop parent click
  onChange={(e) => {
    updateAction(wfIndex, j, {
      ...action,
      actionType: e.target.value,
    });

    setActionPanel({
      open: true,
      wfIndex,
      actionIndex: j,
    });
  }}
  className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full bg-white shadow-sm"
>

                <option value="">Select action</option>

                {action.category === "account" && (
                  <>
                    <option value="login">Login the User</option>
                    <option value="logout">Logout the User</option>
                    <option value="signup">Signup the User</option>
                    <option value="make changes to current user">
                      Make changes to current user
                    </option>
                    <option value="update_user_credentials">
  Update the User's credentials
</option>

                  </>
                )}

                {action.category === "navigation" && (
                  <>
                  <option value="navigate">Go to the Page</option>
                  <option value="refresh">Refresh the Page</option>
                  <option value="previous">Go to the Previous Page</option>
                  </>
                )}

                {action.category === "data" && (
                  <>
                    <option value="create">Create a new thing</option>
                    {/* <option value="update">Update a Thing</option>
                    <option value="delete">Delete a Thing</option>                   */}
                    </>
                )}

                {action.category === "element" && (
                  <>
                    <option value="open_popup">Open Popup</option>
                    <option value="close_popup">Close Popup</option>
                    <option value="show">Show Element</option>
                    <option value="hide">Hide Element</option>
                  </>
                )}
              </select>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm italic mb-2">
          No actions defined
        </p>
      )}

      {/* Add Action */}
      <button
        onClick={() => addAction(wfIndex)}
        className="mt-2 w-full border border-dashed border-blue-400 text-blue-600 text-sm rounded-xl py-2 hover:bg-blue-50 transition"
      >
        + Add Action
      </button>
    </div>
  );
}
