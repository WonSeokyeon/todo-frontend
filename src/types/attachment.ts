// 백엔드 DTO(com.example.todoapp.dto.Attachment*)와 이름을 맞춘다.

export interface AttachmentPresignRequest {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface AttachmentPresignResponse {
  attachmentId: number;
  /**
   * 서버가 완성해서 내려주는 절대 URL.
   * 로컬 백엔드를 가리키는지 S3를 가리키는지 프론트는 알 필요가 없다 — 그대로 PUT한다.
   */
  uploadUrl: string;
  storageKey: string;
}

export interface AttachmentResponse {
  id: number;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  viewUrl: string;
}

export interface AttachmentUrlResponse {
  id: number;
  /** 만료되는 URL이다. 본문 HTML에 저장하지 않는다. */
  viewUrl: string;
}
