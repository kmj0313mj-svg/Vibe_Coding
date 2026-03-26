// Supabase Auth (js/config.js의 API_CONFIG.SUPABASE_* 필요)
(function () {
    let supabaseClient = null;
    let initPromise = null;
    let lastSession = null;

    function normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    function getConfig() {
        if (typeof API_CONFIG === 'undefined') return null;
        const url = API_CONFIG.SUPABASE_URL;
        const key = API_CONFIG.SUPABASE_ANON_KEY;
        if (!url || !key) return null;
        if (String(url).includes('YOUR_SUPABASE') || String(key).includes('YOUR_SUPABASE')) return null;
        return { url: String(url).trim(), key: String(key).trim() };
    }

    function getClient() {
        if (supabaseClient) return supabaseClient;
        const cfg = getConfig();
        if (!cfg) return null;
        if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
            console.error('@supabase/supabase-js가 로드되지 않았습니다.');
            return null;
        }
        supabaseClient = supabase.createClient(cfg.url, cfg.key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        supabaseClient.auth.onAuthStateChange(function (_event, session) {
            lastSession = session;
            syncLocalUser(session);
            if (session) {
                ensureProfileRow(supabaseClient).then(function () {
                    return syncAppData(supabaseClient);
                });
            }
        });
        return supabaseClient;
    }

    function syncLocalUser(session) {
        if (session && session.user) {
            var id = session.user.email || session.user.id;
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', id);
            localStorage.setItem('currentUser', id);
        } else {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('currentUser');
        }
    }

    function syncProfileCache(profile) {
        if (!profile) return;
        localStorage.setItem('mailNotification', String(!!profile.notification_enabled));
        localStorage.setItem('mailRecipient', profile.notification_email || '');
        localStorage.setItem('mailDelay', String(profile.notification_delay_seconds || 30));
        if (profile.created_at) localStorage.setItem('profileCreatedAt', profile.created_at);
    }

    function syncPetCache(pet) {
        localStorage.setItem('petName', pet && pet.name ? pet.name : '');
        localStorage.setItem('petSpecies', pet && pet.species ? pet.species : 'other');
        localStorage.setItem('petAge', pet && pet.age != null ? String(pet.age) : '');
        localStorage.setItem('petTraits', pet && pet.traits ? pet.traits : '');
    }

    async function ensureProfileRow(client) {
        try {
            var res = await client.auth.getUser();
            var user = res.data.user;
            if (!user) return;
            var q = await client.from('profiles').select('id').eq('id', user.id).maybeSingle();
            if (q.data) return;
            await client.from('profiles').upsert(
                {
                    id: user.id,
                    email: user.email || null,
                    notification_enabled: false,
                    notification_email: user.email || null,
                    notification_delay_seconds: 30,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'id' }
            );
        } catch (e) {
            console.warn('profiles 동기화 생략:', e);
        }
    }

    async function syncAppData(client) {
        try {
            var userRes = await client.auth.getUser();
            var user = userRes.data.user;
            if (!user) return;

            var profileRes = await client
                .from('profiles')
                .select('email, created_at, notification_enabled, notification_email, notification_delay_seconds')
                .eq('id', user.id)
                .maybeSingle();

            if (profileRes.data) {
                syncProfileCache(profileRes.data);
            }

            var petRes = await client
                .from('pets')
                .select('id, name, species, age, traits, is_primary, created_at')
                .eq('owner_id', user.id)
                .order('is_primary', { ascending: false })
                .order('created_at', { ascending: true })
                .limit(1);

            syncPetCache(petRes.data && petRes.data[0] ? petRes.data[0] : null);
        } catch (e) {
            console.warn('앱 데이터 동기화 생략:', e);
        }
    }

    window.auth = {
        init: function () {
            if (initPromise) return initPromise;
            initPromise = (async function () {
                var client = getClient();
                if (!client) {
                    lastSession = null;
                    syncLocalUser(null);
                    return null;
                }
                var res = await client.auth.getSession();
                lastSession = res.data.session;
                syncLocalUser(lastSession);
                if (lastSession) {
                    await ensureProfileRow(client);
                    await syncAppData(client);
                }
                return lastSession;
            })();
            return initPromise;
        },

        isConfigured: function () {
            return getConfig() !== null && getClient() !== null;
        },

        getSupabaseClient: function () {
            return getClient();
        },

        isLoggedIn: function () {
            return lastSession != null;
        },

        login: async function (email, password) {
            var client = getClient();
            if (!client) {
                return { ok: false, message: 'Supabase 클라이언트를 만들 수 없습니다.', code: '' };
            }
            var res = await client.auth.signInWithPassword({ email: normalizeEmail(email), password: password });
            if (res.error) {
                console.warn(res.error.message, res.error);
                var code = res.error.code || '';
                var raw = res.error.message || '';
                if (code === 'email_not_confirmed' || /email\s*not\s*confirmed|not\s*confirmed/i.test(raw)) {
                    return {
                        ok: false,
                        code: 'email_not_confirmed',
                        message: '이메일 인증이 아직 완료되지 않았습니다. 가입 시 받은 메일의 링크를 누르거나, 아래에서 인증 메일을 다시 보내 주세요.'
                    };
                }
                if (code === 'invalid_credentials' || /invalid login credentials|invalid credentials/i.test(raw)) {
                    return {
                        ok: false,
                        code: 'invalid_credentials',
                        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
                    };
                }
                return { ok: false, code: code, message: raw || '로그인에 실패했습니다.' };
            }
            lastSession = res.data.session;
            syncLocalUser(res.data.session);
            if (res.data.session) {
                await ensureProfileRow(client);
                await syncAppData(client);
            }
            return { ok: true };
        },

        resendSignupEmail: async function (email) {
            var client = getClient();
            if (!client) return { ok: false, message: '클라이언트 오류' };
            var res = await client.auth.resend({ type: 'signup', email: normalizeEmail(email) });
            if (res.error) {
                return { ok: false, message: res.error.message || '재전송에 실패했습니다.' };
            }
            return { ok: true, message: '인증 메일을 보냈습니다. 메일함을 확인해 주세요.' };
        },

        signup: async function (email, password) {
            var client = getClient();
            if (!client) {
                return { success: false, message: 'Supabase가 설정되지 않았습니다. js/config.js를 확인하세요.' };
            }
            var origin = typeof window.location.origin === 'string' && window.location.origin !== 'null'
                ? window.location.origin
                : '';
            var redirect = origin ? origin + window.location.pathname.replace(/[^/]+$/, 'index.html') : undefined;
            var res = await client.auth.signUp({
                email: normalizeEmail(email),
                password: password,
                options: redirect ? { emailRedirectTo: redirect } : undefined
            });
            if (res.error) {
                var raw = res.error.message || '';
                var msg = raw || '회원가입에 실패했습니다.';
                if (/rate limit|too many requests|email.*limit/i.test(raw)) {
                    msg = '이메일 발송 한도에 걸렸습니다. 30~60분 뒤 다시 시도하거나, Supabase 대시보드 → Authentication → Sign In / Providers → Email에서 「이메일 확인(Confirm email)」을 끄면 인증 메일 없이 가입할 수 있습니다(개발·테스트용).';
                }
                return { success: false, message: msg };
            }
            var needsConfirmation = !res.data.session;
            if (res.data.session) {
                await ensureProfileRow(client);
                await syncAppData(client);
            }
            return { success: true, needsConfirmation: needsConfirmation };
        },

        loadAppData: async function () {
            var client = getClient();
            if (!client) return null;
            await ensureProfileRow(client);
            await syncAppData(client);
            return {
                email: this.getCurrentUser(),
                createdAt: localStorage.getItem('profileCreatedAt') || '',
                mailNotification: localStorage.getItem('mailNotification') === 'true',
                mailRecipient: localStorage.getItem('mailRecipient') || '',
                mailDelay: localStorage.getItem('mailDelay') || '30',
                petName: localStorage.getItem('petName') || '',
                petSpecies: localStorage.getItem('petSpecies') || 'other',
                petAge: localStorage.getItem('petAge') || '',
                petTraits: localStorage.getItem('petTraits') || ''
            };
        },

        saveAppData: async function (payload) {
            var client = getClient();
            if (!client) return { ok: false, message: 'Supabase 클라이언트를 만들 수 없습니다.' };

            var userRes = await client.auth.getUser();
            var user = userRes.data.user;
            if (!user) return { ok: false, message: '로그인 세션이 없습니다.' };

            var profilePayload = {
                id: user.id,
                email: user.email || null,
                notification_enabled: !!payload.mailNotification,
                notification_email: payload.mailRecipient ? normalizeEmail(payload.mailRecipient) : null,
                notification_delay_seconds: Number(payload.mailDelay || 30),
                updated_at: new Date().toISOString()
            };

            var profileUpsert = await client.from('profiles').upsert(profilePayload, { onConflict: 'id' });
            if (profileUpsert.error) {
                return { ok: false, message: profileUpsert.error.message || '사용자 설정 저장에 실패했습니다.' };
            }

            var primaryPetRes = await client
                .from('pets')
                .select('id')
                .eq('owner_id', user.id)
                .eq('is_primary', true)
                .limit(1);

            var petPayload = {
                owner_id: user.id,
                name: String(payload.petName || '').trim(),
                species: payload.petSpecies || 'other',
                age: payload.petAge === '' || payload.petAge == null ? null : Number(payload.petAge),
                traits: String(payload.petTraits || '').trim(),
                is_primary: true,
                updated_at: new Date().toISOString()
            };

            if (primaryPetRes.data && primaryPetRes.data[0]) {
                petPayload.id = primaryPetRes.data[0].id;
            }

            var petUpsert = await client.from('pets').upsert(petPayload, { onConflict: 'id' });
            if (petUpsert.error) {
                return { ok: false, message: petUpsert.error.message || '반려동물 정보 저장에 실패했습니다.' };
            }

            syncProfileCache(profilePayload);
            syncPetCache(petPayload);
            return { ok: true };
        },

        changePassword: async function (currentPassword, newPassword) {
            var client = getClient();
            if (!client) return { ok: false, message: 'Supabase 클라이언트를 만들 수 없습니다.' };

            var userRes = await client.auth.getUser();
            var user = userRes.data.user;
            if (!user || !user.email) return { ok: false, message: '현재 사용자 정보를 확인할 수 없습니다.' };

            var verify = await client.auth.signInWithPassword({
                email: normalizeEmail(user.email),
                password: currentPassword
            });
            if (verify.error) {
                return { ok: false, message: '현재 비밀번호가 일치하지 않습니다.' };
            }

            var update = await client.auth.updateUser({ password: newPassword });
            if (update.error) {
                return { ok: false, message: update.error.message || '비밀번호 변경에 실패했습니다.' };
            }

            return { ok: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
        },

        logout: async function () {
            var client = getClient();
            if (client) await client.auth.signOut();
            lastSession = null;
            syncLocalUser(null);
            window.location.href = 'index.html';
        },

        getCurrentUser: function () {
            if (lastSession && lastSession.user) {
                return lastSession.user.email || lastSession.user.id;
            }
            return localStorage.getItem('username') || localStorage.getItem('currentUser') || null;
        },

        requireAuth: function () {
            if (!this.isLoggedIn()) {
                window.location.href = 'index.html';
            }
        }
    };
})();
