import { Injectable } from "@nestjs/common";
import { ToxicityScores } from "./interfaces/toxicity-scores";

@Injectable()
export class CheckClientHelperService{

    buildGetReportQuery(id: string){
       return `query {
        project_media(ids: "${id}"){
          title
          description
          dbid
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
      }` 
    }
    
    buildCreateItemMutation(url: string, folderId: number, set_tasks_responses: string): string{
        const mutation = `mutation create{
            createProjectMedia(input: {
              project_id: ${folderId},
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

    buildTasksResponses(toxicityScores: ToxicityScores){
        return JSON.stringify({
          toxic_score: toxicityScores.toxicity, 
          severely_toxic_score: toxicityScores.severe_toxicity, 
          obscene_score: toxicityScores.obscene, 
          attack_on_identity_score: toxicityScores.identity_attack, 
          insult_score: toxicityScores.insult, 
          threat_score: toxicityScores.threat, 
          sexually_explicit_score: toxicityScores.sexual_explicit
        })
    }

    buildTicketsByAgentQuery(startDate: Date, endDate: Date){
      const searchQuery = JSON.stringify({
        range: {
          created_at: {
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString()
          }}
      });

      return `query {
        search (query: ${JSON.stringify(searchQuery)}) {
        number_of_results
        medias {
          edges {
            node {
              account {
                user{
                  name
                }
              }
              }
            }
          }
        }
      }`
    }

    buildTicketsByTypeQuery(startDate: Date, endDate: Date){
      return '';
    }

    buildTicketsByChannelQuery(startDate: Date, endDate: Date){
      return '';
    }

    buildTicketsBySourceQuery(startDate: Date, endDate: Date){
      const searchQuery = JSON.stringify({
        range: {
          created_at: {
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString()
          }}
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
      }`
    }

    buildTicketsByTagQuery(tag){
      const searchQuery = JSON.stringify({
        tags: [tag]
      })
      return `query {
        search(query: ${JSON.stringify(searchQuery)}) {
          number_of_results
        }
      }`
    }

    buildTicketsByStatusQuery(status: string){
      const searchQuery = JSON.stringify({
        verification_status: [status]
      });

      return `query {
        search(query: ${JSON.stringify(searchQuery)}) {
          number_of_results
        }
      }`
    }

    buildCreatedVsPublishedQuery(publishedStatus: string){
      const searchQuery = JSON.stringify({
        report_status: [publishedStatus]
      })
      return `query {
        search(query: ${JSON.stringify(searchQuery)}) {
          number_of_results
        }
      }`
    }
}