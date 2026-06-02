import { RegisterFacesRequest, User } from "@/types/auth";
import { statistic } from "@/types/event";

const BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL as string;

// PixShare External API credentials (required by ApiClientAuthMiddleware)
const EXT_API_KEY    = 'A6nSBfjnYIsEby05KIUEbI1drmgAcKjq';
const EXT_API_SECRET = 'Xw8l1YpnRk42IN1UEcBBmmiZ2nohNx4H';
const EXT_AUTH_BASIC = `Basic ${btoa(`${EXT_API_KEY}:${EXT_API_SECRET}`)}`;
const EXT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'X-API-KEY': EXT_API_KEY,
  'Authorization': EXT_AUTH_BASIC,
};

export const apiService = {
  /** Check whether a phone number has paid to access a specific event's gallery.
   *  Returns { exists: boolean, isPaid: boolean } */
  /** Submit a lead from the gallery lead-capture widget */
  async submitLead(payload: {
    eventId: number;
    name: string;
    phone: string;
    email?: string;
    note?: string;
  }): Promise<{ success: boolean; isDuplicate?: boolean }> {
    try {
      const res = await fetch(`${BASE_URL}/GalleryLeads`, {
        method: 'POST',
        headers: EXT_HEADERS,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, isDuplicate: data.isDuplicate ?? false };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  /** Check whether a phone number has paid to access a specific event's gallery.
   *  Returns { exists: boolean, isPaid: boolean } */
  async verifyGalleryPayment(phoneNumber: string, eventId: number): Promise<{ exists: boolean; isPaid: boolean }> {
    try {
      const res = await fetch(
        `${BASE_URL}/external/users-access/verifyUserPayment?phoneNumber=${encodeURIComponent(phoneNumber)}&eventId=${eventId}`,
        { headers: EXT_HEADERS }
      );
      if (res.ok) {
        const data = await res.json();
        return { exists: data.exists ?? true, isPaid: data.isPaid ?? false };
      }
      if (res.status === 404) {
        return { exists: false, isPaid: false };
      }
      return { exists: false, isPaid: false };
    } catch {
      return { exists: false, isPaid: false };
    }
  },

  async sendSMS(phoneNumber: string, message: string, otp: boolean = true) {
    try {
      const smsData = {
        phoneNumber,
        message,
        otp,
      };

      const res = await fetch(`${BASE_URL}/Photographer/sendSMS`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(smsData),
      });

      if (!res.ok) {
        throw new Error("Failed to send SMS");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : { success: true };
    } catch (error) {
      console.error("SMS API Error:", error);
      throw error;
    }
  },

  async sendOTPEmail(email: string) {
    try {
      const res = await fetch(
        `${BASE_URL}/Photographer/SendEmailOtp?email=${email}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(email),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to send email OTP");
      }

      // אם התגובה ריקה, נחזיר אובייקט פשוט
      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : { success: true };
    } catch (error) {
      console.error("Email OTP API Error:", error);
      throw error;
    }
  },
  async registerSelectedFaces(data: RegisterFacesRequest) {
    const res = await fetch(`${BASE_URL}/User/register-selected-faces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to register selected faces");
    }

    return res.json();
  },
  async reRegisterSelectedFaces(data: RegisterFacesRequest) {
    const res = await fetch(`${BASE_URL}/User/re-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to register selected faces");
    }

    return res.json();
  },
  async verifyOTP(phoneNumberOrEmail: string, otp: string): Promise<boolean> {
    try {
      const request = {
        PhoneNumberOrEmail: phoneNumberOrEmail,
        otp: otp,
      };

      const res = await fetch(`${BASE_URL}/Photographer/verifyOtp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        throw new Error("Failed to verify OTP");
      }

      const responseText = await res.text();
      const response = responseText ? JSON.parse(responseText) : null;
      return response?.verified || false;
    } catch (error) {
      console.error("OTP Verification API Error:", error);
      return false;
    }
  },

  async authenticateUser(
    userPhoneOrEmail: string,
    eventId: number,
    authenticateBy: "PhoneNumber" | "Email",
  ): Promise<any> {
    try {
      const encodedUserPhoneOrEmail = encodeURIComponent(userPhoneOrEmail);
      const url = `${BASE_URL}/User/authenticateUser?userPhone=${encodedUserPhoneOrEmail}&&eventId=${eventId}&&authenticateBy=${authenticateBy}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to authenticate user");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("User Authentication API Error:", error);
      return null;
    }
  },

  async registerUser(formData: FormData): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/User`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to register user");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("User Registration API Error:", error);
      throw error;
    }
  },

  async registerUserByPhoto(formData: FormData): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/User/registerByPhoto`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to register user by photo");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("User Registration by Photo API Error:", error);
      throw error;
    }
  },

  async addUser(formData: FormData): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/User/addUser`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to register user by photo");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("User Registration by Photo API Error:", error);
      throw error;
    }
  },

  async sendWelcomeSMS(
    phoneNumber: string,
    eventLink: string,
    userId: string,
  ): Promise<any> {
    try {
      const message = `היי, הגלריה האישית שלך כאן🎉
אם אין תמונות כרגע, תקבל/י התראה כשהן יעלו 🔔
לצפייה מהירה בגלריה 👇🏼
https://gallery.pixshare.live/${eventLink}?userid=${userId}

בברכה, Pixshare AI`;

      const smsData = {
        phoneNumber,
        message,
        otp: false,
      };

      const res = await fetch(`${BASE_URL}/Photographer/sendSMS`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(smsData),
      });

      if (!res.ok) {
        throw new Error("Failed to send welcome SMS");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : { success: true };
    } catch (error) {
      console.error("Welcome SMS API Error:", error);
      throw error;
    }
  },

  async checkEventLock(eventId: number, code: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/Event/CheckEventLock?eventId=${eventId}&lockValue=${code}&lockType=Code`,
        {
          method: "GET", // או 'POST' אם ה-API דורש, אך שים לב לנושא הקודם עם ה-405
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.isLocked;
    } catch (error) {
      console.error("Error checking event lock:", error);
    }
  },

  async sendWelcomeEmail(email: string, eventLink: string, userId: string) {
    try {
      const res = await fetch(`${BASE_URL}/User/send-welcome-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          eventLink,
          userId: userId.toString(), // 👈 הופך למחרוזת
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send welcome email");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("Send Welcome Email Error:", error);
      throw error;
    }
  },

  async loginUser(userId: number): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/User?userId=${userId}`);

      if (!res.ok) {
        throw new Error("Failed to login user");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("Login User API Error:", error);
      throw error;
    }
  },

  async getUserForUser(userId: number): Promise<any> {
    try {
      const res = await fetch(
        `${BASE_URL}/User/getUsersForUser?userId=${userId}`,
      );

      if (!res.ok) {
        throw new Error("Failed to get users for user");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("Get Users For User API Error:", error);
      throw error;
    }
  },

  async getImages(
    userId: number,
    eventId: number,
    allMyUsersPhotos: boolean = false,
  ): Promise<any> {
    try {
      const queryParams = `?userid=${userId}&eventid=${eventId}&allMyUsersPhotos=${allMyUsersPhotos}`;
      const url = `${BASE_URL}/User/getImages${queryParams}`;
      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to get user images");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("Get Images API Error:", error);
      throw error;
    }
  },

  async downloadUserImg(downloadRequest: any): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/User/download-zip-user`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(downloadRequest),
      });

      if (!res.ok) {
        throw new Error("Failed to request download");
      }

      const responseText = await res.text();
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("Download User Images API Error:", error);
      throw error;
    }
  },

  async getEvent(eventLink: string) {
    try {
      const res = await fetch(
        `${BASE_URL}/Event/getPublicByEventLink?eventLink=${eventLink}`,
        {
          credentials: "include",
        },
      );
      if (!res.ok) {
        if (res.status === 404) {
          return null; // אירוע לא נמצא
        }
        throw new Error("Failed fetching event data");
      }
      const eventData = await res.json();
      return eventData;
    } catch (error) {
      console.error("API Error:", error);
      return null; // אירוע לא נמצא
    }
  },

  async getEventImagesFullData(eventLink: string) {
    try {
      const eventData = await this.getEvent(eventLink);
      if (!eventData) {
        throw new Error("Event not found");
      }

      const eventId = eventData.id;
      const queryParams = `?eventId=${eventId}&pageNumber=1&pageSize=100000`;
      const url = `${BASE_URL}/Event/AllImagesFullData${queryParams}`;
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed fetching photos");
      return res.json();
    } catch (error) {
      console.error("Error fetching images:", error);
      throw error;
    }
  },

  async getEventAlbums(eventId: string) {
    const url = `${BASE_URL}/EventAlbom/getForEvent?id=${eventId}`;
    const res = await fetch(url, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed fetching albums");
    return res.json();
  },

  async updateUser(user: User) {
    const url = `${BASE_URL}/User/update-user`;

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": await getXSRFToken(),
      },
      body: JSON.stringify(user),
    });

    if (!res.ok) {
      throw new Error("Failed updating user");
    }

    const data = await res.json();
    return data;
  },
  async getEventStatistic(eventId: number) {
    const url = `${BASE_URL}/Event/GetStatisticsForEvent?eventId=${eventId}`;

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed updating user");
    }

    if (res.status === 204) {
      const emptyStats: statistic = {
        id: 0,
        eventId: eventId,
        downloadClickSum: 0,
        sharePhotoClickSum: 0,
        downloadAllPhoto: 0,
        favoritesPhotosSum: 0,
        enterToGallery: 0,
      };
      return emptyStats;
    }
    const data = await res.json();
    return data;
  },

  async saveEventStatistic(statistics: statistic) {
    const url = `${BASE_URL}/Event/saveStatisticsForEvent`;

    const res = await fetch(url, {
      method: "post",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": await getXSRFToken(),
      },
      body: JSON.stringify(statistics),
    });

    if (!res.ok) {
      throw new Error("Failed updating user");
    }

    const data = await res.json();
    return data;
  },
  async updateStatistic(eventId: number, actionType: string) {
    await fetch(`${BASE_URL}/Event/UpdateStatistic`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": await getXSRFToken(),
      },
      body: JSON.stringify({ eventId, actionType }),
    });
  },
  async getPostDescriptionByEventId(eventId: number): Promise<any> {
    try {
      const res = await fetch(
        `${BASE_URL}/Event/GetPostDescriptionByEventId/${eventId}`,
        {
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error("Failed to get post description");
      }

    const responseText = await res.text();
    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    console.error("GetPostDescriptionByEventId API Error:", error);
    throw error;
  }
  },

  // ── Survey ───────────────────────────────────────────────────────────────────

  async getSurveyByEvent(eventId: number): Promise<any | null> {
    try {
      const res = await fetch(`${BASE_URL}/Survey/by-event/${eventId}`);
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async hasSurveyUserResponded(surveyId: number, userId: number): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/Survey/${surveyId}/user-responded/${userId}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.responded ?? false;
    } catch {
      return false;
    }
  },

  async submitSurveyResponse(response: {
    surveyId: number;
    userId: number;
    isSkipped: boolean;
    answers: Array<{
      questionId: number;
      freeText?: string;
      starRating?: number;
      selectedOptionId?: number;
    }>;
  }): Promise<void> {
    try {
      await fetch(`${BASE_URL}/Survey/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
    } catch {
      /* silent — survey failure should never block gallery access */
    }
  },

  /**
   * Verify an admin link token server-side.
   * The server checks the token against the stored AdminToken — never exposed in the public event response.
   */
  async verifyAdminToken(eventLink: string, token: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${BASE_URL}/Event/verify-admin?eventLink=${encodeURIComponent(eventLink)}&token=${encodeURIComponent(token)}`
      );
      const data = await res.json();
      return data?.isValid === true;
    } catch {
      return false;
    }
  },

  // ── Site OTP (reuses existing Photographer OTP endpoints) ────────────────────

  /** Send a 4-digit OTP to a phone number via SMS */
  async siteSendOtpPhone(phoneNumber: string): Promise<void> {
    await fetch(`${BASE_URL}/Photographer/sendSMS`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ PhoneNumber: phoneNumber, message: 'קוד האימות שלך לגלריה', OTP: true }),
    });
  },

  /** Send a 4-digit OTP to an email address */
  async siteSendOtpEmail(email: string): Promise<void> {
    await fetch(`${BASE_URL}/Photographer/SendEmailOtp?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });
  },

  /** Verify a 4-digit OTP code (works for both phone and email) */
  async siteVerifyOtp(contact: string, code: string): Promise<{ verified: boolean }> {
    try {
      const res = await fetch(`${BASE_URL}/Photographer/verifyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ PhoneNumberOrEmail: contact, Otp: code }),
      });
      if (!res.ok) return { verified: false };
      return res.json();
    } catch {
      return { verified: false };
    }
  },

  // ── Site ─────────────────────────────────────────────────────────────────────

  /** Get public site data by slug (branding + events list). */
  async getSiteBySlug(slug: string): Promise<any | null> {
    try {
      const res = await fetch(`${BASE_URL}/Site/by-slug/${encodeURIComponent(slug)}`);
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  /**
   * Login to a site using a selfie (face search).
   * Returns { success, userId, name, photoUrl, message }
   */
  async siteLogin(siteId: number, selfieBase64: string): Promise<any> {
    const formData = new FormData();
    const blob = await fetch(selfieBase64).then(r => r.blob());
    formData.append('selfie', blob, 'selfie.jpg');

    const res = await fetch(`${BASE_URL}/Site/${siteId}/login`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  /**
   * Register a visitor to a site using a selfie + contact info.
   * Returns { success, userId, name, photoUrl, message, isExisting }
   */
  async siteRegister(
    siteId: number,
    selfieBase64: string,
    data: { fullName?: string; phoneNumber?: string; email?: string; authenticateBy?: string; sendNotification?: boolean }
  ): Promise<any> {
    const formData = new FormData();
    const blob = await fetch(selfieBase64).then(r => r.blob());
    formData.append('selfie', blob, 'selfie.jpg');
    if (data.fullName)       formData.append('fullName', data.fullName);
    if (data.phoneNumber)    formData.append('phoneNumber', data.phoneNumber);
    if (data.email)          formData.append('email', data.email);
    formData.append('authenticateBy', data.authenticateBy ?? 'PhoneNumber');
    formData.append('sendNotification', String(data.sendNotification ?? true));

    const res = await fetch(`${BASE_URL}/Site/${siteId}/register`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  /** Get site stats (optionally per-user). */
  async getSiteStats(siteId: number, userId?: number): Promise<any> {
    const query = userId ? `?userId=${userId}` : '';
    const res = await fetch(`${BASE_URL}/Site/${siteId}/stats${query}`);
    if (!res.ok) throw new Error('Failed to get site stats');
    return res.json();
  },

  /**
   * Get basic info (name, photoUrl) for a specific site user.
   * Used in gallery photographer-preview mode.
   */
  async getSiteUserInfo(siteId: number, userId: number): Promise<{ success: boolean; userId?: number; name?: string; photoUrl?: string } | null> {
    try {
      const res = await fetch(`${BASE_URL}/Site/${siteId}/user/${userId}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  /**
   * Check if a user with this email/phone is already registered to this site.
   * Returns { success, userId, name, photoUrl, message }
   * success=false means not registered → caller should show selfie registration.
   */
  async siteLoginByContact(
    siteId: number,
    contact: { email?: string; phoneNumber?: string }
  ): Promise<{ success: boolean; userId?: number; name?: string; photoUrl?: string; message?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/Site/${siteId}/login-by-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      if (!res.ok) return { success: false };
      return res.json();
    } catch {
      return { success: false };
    }
  },
}

// Private
const getXSRFToken = async () => {
  return (await window.cookieStore.get("XSRF-TOKEN"))?.value ?? "";
};
