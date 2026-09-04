"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryClient";
import { validateImageFile } from "@/lib/validation";
import type {
  AttachmentPresignResponse,
  AttachmentResponse,
  AttachmentUrlResponse,
} from "@/types/attachment";

/**
 * 조회 URL은 30분 만료다. 그보다 짧게 잡아 만료된 URL이 캐시에서 나오지 않게 한다.
 * (CLAUDE.md 5장 app.storage.view-url-expiry-minutes=30)
 */
const VIEW_URL_STALE_TIME = 20 * 60 * 1000;

/**
 * 서버가 준 uploadUrl로 파일을 올린다.
 *
 * 이 프로젝트에서 apiClient를 쓰지 않는 유일한 함수다. apiClient는 Authorization 헤더와
 * credentials:"include"를 자동으로 붙이는데, Phase 13에서 이 URL이 S3 presigned PUT으로
 * 바뀌면 헤더가 서명을 깨뜨리고 쿠키도 불필요하다. 로컬·S3 양쪽에서 동일하게 동작하려면
 * 헤더 없는 순수 PUT이어야 한다 (CLAUDE.md 5장).
 *
 * 정리한다고 apiClient로 되돌리면 로컬에서는 계속 동작하고 S3 전환 시점에만 깨진다.
 */
async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error("이미지 업로드에 실패했습니다.");
  }
}

/**
 * presign → PUT → complete 3단계를 한 번에 수행한다.
 * 성공하면 첨부 ID와 표시용 조회 URL을 돌려준다.
 */
export async function uploadAttachment(
  file: File,
): Promise<{ attachmentId: number; viewUrl: string }> {
  // 서버 검증은 그대로 유지하되, 불필요한 왕복을 미리 막는다.
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const presigned = await apiClient.post<AttachmentPresignResponse>("/attachments/presign", {
    filename: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  await uploadFile(presigned.uploadUrl, file);

  const completed = await apiClient.post<AttachmentResponse>(
    `/attachments/${presigned.attachmentId}/complete`,
  );

  return { attachmentId: completed.id, viewUrl: completed.viewUrl };
}

/** 본문에 들어 있는 첨부들의 조회 URL을 일괄로 가져온다. */
export function useAttachmentUrls(ids: number[]) {
  return useQuery({
    queryKey: queryKeys.attachmentUrls(ids),
    queryFn: () => apiClient.get<AttachmentUrlResponse[]>(`/attachments/urls?ids=${ids.join(",")}`),
    // id가 없으면 요청 자체를 보내지 않는다.
    enabled: ids.length > 0,
    staleTime: VIEW_URL_STALE_TIME,
    retry: false,
  });
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  await apiClient.delete<void>(`/attachments/${attachmentId}`);
}
