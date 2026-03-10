import Resolver from "@forge/resolver";
import api, { route } from "@forge/api";

const resolver = new Resolver();

// Property key for storing checklist data
const CHECKLIST_PROPERTY_KEY = "checklist-data";

resolver.define("getChecklist", async (req) => {
  const issueKey = req.context.extension.issue.key;
  try {
    const res = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/issue/${issueKey}/properties/${CHECKLIST_PROPERTY_KEY}`,
      );

    if (res.status === 404) {
      console.log(
        `${issueKey}: Checklist property not found, returning initial state.`,
      );
      return { items: [] };
    }

    if (!res.ok) {
      console.error(
        `${issueKey}: Error fetching checklist: ${res.status} ${res.statusText}`,
      );
      const errProps = await res.text();
      console.error(errProps);
      return { items: [] };
    }

    const data = await res.json();
    return data.value;
  } catch (err) {
    console.error(`Failed to get checklist for ${issueKey}: `, err);
    return { items: [] };
  }
});

resolver.define("saveChecklist", async (req) => {
  const issueKey = req.context.extension.issue.key;
  const checklistData = req.payload.data;

  try {
    const res = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/issue/${issueKey}/properties/${CHECKLIST_PROPERTY_KEY}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(checklistData),
        },
      );

    if (!res.ok) {
      console.error(
        `${issueKey}: Error saving checklist: ${res.status} ${res.statusText}`,
      );
      const errProps = await res.text();
      console.error(errProps);
      throw new Error(
        `Failed to save checklist: ${res.status} ${res.statusText}`,
      );
    }

    console.log(`${issueKey}: Successfully saved checklist data.`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to save checklist for ${issueKey}: `, err);
    throw err;
  }
});

export const handler = resolver.getDefinitions();
