import { Injectable } from '@nestjs/common';
// import { throwIfEmpty } from 'rxjs/operators';
import { ToxicityScores } from './interfaces/toxicity-scores';
import { getLabel, MeedanLabels} from '@iverify/common/src';

@Injectable()
export class CheckClientHelperService {
  lang = process.env.language + `-` + process.env.COUNTRY_CODE;
  buildGetReportQuery(id: string) {
    return `query {
        project_media(ids: "${id}"){
          title
          description
          dbid
          status
          created_at
          source {
            name
    			}
          media {
            metadata
          }
          annotation(annotation_type: "verification_status") {
            data
          }
          tasks {
            edges {
              node {
                fieldset
                label
                first_response_value
              }
            }
          },
          tags {
            edges {
              node {
                id
                tag_text
              }
            }
          }
        }
      }`;
  }

  buildGetMeedanReportQuery(id: string) {
    return `query {
       project_media(ids: "${id}"){
         annotation(annotation_type: "report_design") {
           data
         }
       }
     }`;
  }

  buildCreateItemMutation(
    url: string,
    folderId: number,
    set_tasks_responses: string,
    tags: string[]
  ): string {
    const mutation = `mutation create{
            createProjectMedia(input: {
              set_tags: ["${tags.join('", "')}"],
              url: "${url}",
              clientMutationId: "1",
              set_tasks_responses: ${JSON.stringify(set_tasks_responses)}
            }) {
              project_media {
                title
                dbid
                id
              }
            }
          }`
        return mutation;

    }


    buildCreateItemFromRadioMessage(url: string, name, content, created_date, tag = 'Radio') {
      const tasksResponsesObj = {
        [getLabel(this.lang, MeedanLabels.AUDIO_URL)]: url,
        [getLabel(this.lang, MeedanLabels.MESSAGE)]: content,
        [getLabel(this.lang, MeedanLabels.ORIGINAL_REPORTED_DATE)]: created_date,
      };
      let setTasksResponses = JSON.stringify(tasksResponsesObj);
      setTasksResponses = setTasksResponses.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `
        mutation {
          createProjectMedia(
            input: {
              set_tags: ["${tag}"],
              set_tasks_responses: "${setTasksResponses}",
              media_type: "Claim",
              url: "",
              quote: "${name}"
            }
          ) {
            project_media {
              dbid
              id
              tasks {
              edges {
                node {
                  id
                  fieldset
                  label
                }
              }
            }
            }
          }
        }
      `;
    }


  buildCreateItemFromWPMutation(
    url: string,
    content: string,
    wp_key = 'message_from_website',
    tags: string[]
  ): string {
    const folderId = +process.env.CHECK_TIPLINE_FOLDER_ID;
    const taskResponse = JSON.stringify({
      [wp_key]: content,
    });
    const mutation = `mutation create {
        createProjectMedia(input: {
          set_tags: [${tags.length > 0 ? `"${tags.join('", "')}"` : '""'}],
          url: "${url}",
          set_tasks_responses: ${JSON.stringify(taskResponse)},
          clientMutationId: "1"
        }) {
          project_media {
            title
            dbid
            id
            tasks {
              edges {
                node {
                  id
                  fieldset
                  label
                  first_response_value
                }
              }
            }
          }
          project {
            id
          }
        }
      }`;

    return mutation;
  }

  buildAnnotationItemsCombinedFromWpMutation(
    id: string,
    type: string,
    set_field: string,
    value: string,
  ): string {
    const taskSubResponse = JSON.stringify({
      [set_field]: value,
    });
    const taskResponse = JSON.stringify({
      ["annotation_type"]: type,
      ["set_fields"]:taskSubResponse
    });
    const mutation = `mutation create {
        updateTask(input: {
          clientMutationId: "1",
          id: "${id}",
          response: ${JSON.stringify(taskResponse)}
        }) {
          task {
            id
          }
        }
       }`;
    return mutation;
  }

  buildTasksResponses(toxicityScores: ToxicityScores) {
    return JSON.stringify({
      detoxify_score: toxicityScores.toxicity,
      detoxify_severe_toxicity_score: toxicityScores.severe_toxicity,
      detoxify_obscene_score: toxicityScores.obscene,
      detoxify_identity_attack_score: toxicityScores.identity_attack,
      detoxify_insult_score: toxicityScores.insult,
      detoxify_threat_score: toxicityScores.threat,
      detoxify_sexual_explicit_score: toxicityScores.sexual_explicit,
    });
  }

  buildTicketsByAgentQuery(startDate: string, endDate: string) {
    const searchQuery = JSON.stringify({
      range: {
        created_at: {
          start_time: startDate,
          end_time: endDate,
        },
      },
      archived: 0,
    });

    return `query {
        search (query: ${JSON.stringify(searchQuery)}) {
        number_of_results
        medias {
          edges {
            node {
              status
              account {
                user{
                  name
                }
              }
              }
            }
          }
        }
      }`;
  }

  buildTicketsByTypeQuery(startDate: string, endDate: string) {
    const searchQuery = JSON.stringify({
      range: {
        created_at: {
          start_time: startDate,
          end_time: endDate,
        },
      },
      archived: 0,
    });

    return `query {
        search (query: ${JSON.stringify(searchQuery)}) {
        number_of_results
        medias {
          edges {
            node {
              status
              tasks {
                edges {
                  node {
                    id
                    label
                    first_response_value
                  }
                }
              }
              }
            }
          }
        }
      }`;
  }

  buildTicketsByTaskTypeQuery(taskId: string, value: string) {
    const searchQuery = JSON.stringify({
      team_tasks: [
        {
          id: taskId,
          response: value,
        },
      ],
      archived: 0,
    });

    return `query {
        search(query: ${JSON.stringify(searchQuery)}) {
          number_of_results
        }
      }`;
  }

  buildTicketsByChannelQuery(startDate: string, endDate: string) {
    return '';
  }

  buildAllAgentsQuery(teamSlug: string) {
    return `query {
        team(slug: "${teamSlug}") {
          users {
            edges {
              node {
                id
                dbid
                name
              }
            }
          }
        }
      }`;
  }

  buildGetByAgentAndStatus(agentId: number, status: string) {
    const searchQuery = JSON.stringify({
      assigned_to: [agentId],
      verification_status: [status],
      archived: 0,
    });

    return `query {
        search(query: ${JSON.stringify(searchQuery)}) {
          number_of_results
        }
      }`;
  }

  formatAllAgentsResponse(response: any) {
    const isValid =
      response &&
      response.team &&
      response.team.users &&
      response.team.users.edges;
    if (!isValid) return [];
    const edges = response.team.users.edges;
    return edges.reduce((acc, val) => {
      const node = val.node;
      const name = node.name;
      const id = node.dbid;
      acc.push({ name, id });
      return acc;
    }, []);
  }

  buildAllProjectsQuery(teamSlug: string) {
    return `query {
        team(slug: "${teamSlug}") {
          projects {
            edges {
              node {
                id
                dbid
                title
              }
            }
          }
        }
      }`;
  }

  formatAllProjectsResponse(response: any) {
    const isValid =
      response &&
      response.team &&
      response.team.projects &&
      response.team.projects.edges;
    if (!isValid) return [];
    const edges = response.team.projects.edges;
    return edges.reduce((acc, val) => {
      const node = val.node;
      const title = node.title.trim();
      const id = node.dbid;
      acc.push({ title, id });
      return acc;
    }, []);
  }

  buildCountByProjectQuery(projectId: number) {
    const searchQuery = JSON.stringify({
      projects: [projectId],
      archived: 0,
    });

    return `query {
        search(query: ${JSON.stringify(searchQuery)}) {
          number_of_results
        }
      }`;
  }

  buildTicketsBySourceQuery(startDate: string, endDate: string) {
    const searchQuery = JSON.stringify({
      range: {
        created_at: {
          start_time: startDate,
          end_time: endDate,
        },
      },
      archived: 0,
    });

    return `query {
        search (query: ${JSON.stringify(searchQuery)}) {
        number_of_results
        medias {
          edges {
            node {
              domain
                source {
                  name
                  }
              }
            }
          }
        }
      }`;
  }

  buildTeamTagsQuery(team: string) {
    return `query {
        team(slug: "${team}") {
          tag_texts {
            edges {
              node {
                text
              }
            }
          }
        }
      }`;
  }

  buildTicketsByTagQuery(tag) {
    const searchQuery = JSON.stringify({
      tags: [tag],
      archived: 0,
    });
    return `query {
        search(query: ${JSON.stringify(searchQuery)}) {
          number_of_results
        }
      }`;
  }

  buildTicketsByStatusQuery(status: string) {
    const searchQuery = JSON.stringify({
      verification_status: [status],
      archived: 0,
    });

    return `query {
        search(query: ${JSON.stringify(searchQuery)}) {
          number_of_results
        }
      }`;
  }

  buildCreatedVsPublishedQuery(publishedStatus: string) {
    const searchQuery = JSON.stringify({
      report_status: [publishedStatus],
      archived: 0,
    });
    return `query {
        search(query: ${JSON.stringify(searchQuery)}) {
          number_of_results
        }
      }`;
  }

  buildAllMediaQuery(teamSlug: string) {
    return `query {
        team(slug: "${teamSlug}") {
          medias_count
        }
      }`;
  }

  buildTicketLastStatusQuery(id: string) {
    return `query {
        project_media(ids: "${id}") {
          title
          created_at
          log(last: 2) {
            edges {
              node {
                event_type
                object_changes_json
                created_at
              }
            }
          }
        }
      }`;
  }

  buildGetAllFoldersQuery(teamSlug: string) {
    return `query {
        team(slug: "${teamSlug}") {
          title
          created_at
          projects {
            edges {
              node {
                dbid
                title
                description
              }
            }
          }
        }
      }`
    }

    buildGetLatestFromTagQuery(tag: string) {
      return `query {
        search(query: "{\\"tags\\": [\\"${tag}\\"]}") {
          number_of_results
          medias(first: 1) {
            edges {
              node {
                title
                status
                created_at,
                tasks {
                  edges {
                    node {
                      fieldset
                      label
                      first_response_value
                    }
                  }
                }
              }
            }
          }
        }
      }`
    }
}
