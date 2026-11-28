/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const Cloud = {
  sb: null,
  user: null,
  profile: null,
  started: false,
  booting: true,
  school: [],
  // [{ institution_id, role, class_id, inst: {id,name}, cls: {id,name} | null }]
  pushT: null,
  pushing: false,
  pushAgain: false,
  pending: false,
  progT: {},
  lastProfile: "",
  get enabled() {
    return !!this.sb;
  },
  get uid() {
    return this.user ? this.user.id : null;
  },
  async token() {
    try {
      const r = await this.sb.auth.getSession();
      return r.data.session ? r.data.session.access_token : null;
    } catch (e) {
      return null;
    }
  },
  isStaff(inst) {
    return this.school.some((m) => m.institution_id === inst && (m.role === "owner" || m.role === "teacher"));
  },
  anyStaff() {
    return this.school.some((m) => m.role === "owner" || m.role === "teacher");
  },
  member(inst) {
    return this.school.find((m) => m.institution_id === inst) || null;
  },
  init() {
    const C = window.DO_CONFIG || {};
    if (ENV !== "web" || !window.supabase || !C.supabaseUrl) return;
    this.sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, {
      // iPhone/iPad'de arka plana atılan uygulamada tarayıcı kilidi (navigator.locks) takılı kalıp her isteği
      // saniyelerce bekletebiliyor; tek sekmelik bu uygulama için bellek içi kilit yeterli
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "implicit",
        storageKey: "dersozetim.auth",
        lock: window.supabase.processLock || void 0
      }
    });
  },
  /* son bilinen dershane ve yönetici bilgisi: açılışta sunucuyu beklemeden gösterilir */
  cacheKey() {
    return "dersozetim.cache." + this.uid;
  },
  saveCache() {
    try {
      localStorage.setItem(this.cacheKey(), JSON.stringify({ school: this.school, isAdmin: this.isAdmin, profile: this.profile }));
    } catch (e) {
    }
  },
  loadCache() {
    try {
      const c = JSON.parse(localStorage.getItem(this.cacheKey()) || "null");
      if (c) {
        this.school = c.school || [];
        this.isAdmin = !!c.isAdmin;
        this.profile = c.profile || null;
      }
    } catch (e) {
    }
  },
  async start() {
    if (!this.sb) {
      this.booting = false;
      return;
    }
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("dersozetim.auth") || "null");
    } catch (e) {
    }
    const su = stored && (stored.user || stored.currentSession && stored.currentSession.user);
    const fast = !!(su && su.id && DB.d.owner === su.id && DB.d.onboarded);
    if (fast) {
      this.user = su;
      this.loadCache();
      this.booting = false;
      render();
    }
    let session = null;
    const late = new Promise((ok) => setTimeout(() => ok("late"), 8e3));
    try {
      const r = await Promise.race([this.sb.auth.getSession(), late]);
      if (r === "late") {
        session = su ? { user: su } : null;
        if (window.__diag) __diag.send("late", { step: "session" });
      } else session = r.data.session;
    } catch (e) {
      if (fast) session = { user: su };
    }
    if (window.__diag) __diag.mark("sess");
    this.user = session ? session.user : null;
    if (fast && !this.user) {
      this.school = [];
      render();
    }
    this.sb.auth.onAuthStateChange((ev, s) => {
      const was = this.uid;
      this.user = s ? s.user : null;
      if (ev === "SIGNED_OUT") {
        this.school = [];
        this.profile = null;
        render();
        return;
      }
      if (ev === "PASSWORD_RECOVERY") {
        this.recovery = true;
        setTimeout(() => {
          if (DB.d.onboarded) pwSheet();
        }, 400);
      }
      if (this.uid && this.uid !== was && !this.inLogin) setTimeout(() => this.afterLogin().then(() => {
        if (location.hash.includes("access_token")) history.replaceState(null, "", location.pathname + "#/bugun");
        parseRoute();
        render();
      }), 0);
    });
    if (this.user) {
      const t = setTimeout(() => {
        if (this.booting) {
          this.booting = false;
          render();
          if (window.__diag) __diag.send("late", { step: "sync" });
        }
      }, 1e4);
      await this.afterLogin();
      clearTimeout(t);
    }
    if (window.__diag) __diag.mark("cloud");
    this.booting = false;
    window.addEventListener("online", () => {
      if (this.pending) this.schedulePush(10);
    });
  },
  /* ---------- giriş ---------- */
  async sendCode(email) {
    const { error } = await this.sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } });
    if (error) throw error;
  },
  async verifyCode(email, token) {
    const { data, error } = await this.sb.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw error;
    return data;
  },
  async signUp(email, password) {
    const { data, error } = await this.sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) throw error;
    if (data && data.user && Array.isArray(data.user.identities) && !data.user.identities.length) throw new Error("already registered");
    return data;
  },
  async signIn(email, password) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async resetPassword(email) {
    const { error } = await this.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    if (error) throw error;
  },
  async setPassword(password) {
    const { error } = await this.sb.auth.updateUser({ password });
    if (error) throw error;
  },
  hasPassword() {
    const u = this.user;
    if (!u) return false;
    const prov = u.app_metadata && u.app_metadata.providers || [u.app_metadata && u.app_metadata.provider];
    return !!DB.d.profile.pwSet || prov.includes("email");
  },
  async checkPassword(password) {
    this.inLogin = true;
    try {
      const { error } = await this.sb.auth.signInWithPassword({ email: this.user.email, password });
      if (error) throw error;
    } finally {
      this.inLogin = false;
    }
  },
  needsPassword() {
    const u = this.user;
    if (!u || DB.d.profile.pwSet) return false;
    const prov = u.app_metadata && u.app_metadata.providers || [];
    return !prov.includes("email");
  },
  async google() {
    const { error } = await this.sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: "select_account" } } });
    if (error) throw error;
  },
  async signOut() {
    clearTimeout(this.pushT);
    await this.push();
    try {
      await this.sb.auth.signOut();
    } catch (e) {
    }
    this.user = null;
    this.school = [];
    this.profile = null;
    this.isAdmin = false;
    if (this.stateCh) {
      try {
        this.sb.removeChannel(this.stateCh);
      } catch (e) {
      }
      this.stateCh = null;
    }
    const keep = { ai: DB.d.ai, theme: DB.d.profile.theme };
    DB.d = DB.normalize(DB.blank());
    DB.d.ai = keep.ai;
    DB.d.profile.theme = keep.theme;
    DB.persist();
  },
  async deleteAccount() {
    const { error } = await this.sb.rpc("delete_my_account");
    if (error) throw error;
    try {
      await this.sb.auth.signOut();
    } catch (e) {
    }
    localStorage.removeItem(DB.KEY);
    this.user = null;
    DB.load();
  },
  applyRemote(data) {
    const keep = { ai: DB.d.ai, owner: DB.d.owner };
    DB.d = Object.assign(DB.normalize(data), keep);
    DB.persist();
  },
  /* Aynı hesap başka bir cihazda değişince (görev, sayaç, kronometre) burası anında haber alır. */
  listenState() {
    if (this.stateCh || !this.uid) return;
    this.stateCh = this.sb.channel("state-" + this.uid).on("postgres_changes", { event: "*", schema: "public", table: "user_state", filter: "user_id=eq." + this.uid }, (p) => {
      const d = p.new && p.new.data;
      if (d && d.mtime) {
        if (d.mtime > (DB.d.mtime || 0)) {
          this.applyRemote(d);
          this.onRemote();
        }
      } else this.refresh().then((ch) => {
        if (ch) this.onRemote();
      });
    }).subscribe();
  },
  onRemote() {
    if (typeof pmLoop === "function") pmLoop();
    if (typeof swLoop === "function") swLoop();
    if (!document.querySelector(".sheet-wrap") && route.page !== "oda" && route.page !== "not") render();
  },
  async afterLogin() {
    const soft = (p, n) => p.catch((e) => {
      console.warn(n, e);
      return void 0;
    });
    const [, prof, admin, school] = await Promise.all([
      soft(this.pullState(), "state"),
      soft(this.fetchProfile(), "profile"),
      this.rpc("is_app_admin").then((v) => !!v, () => void 0),
      soft(this.fetchSchool(), "school")
    ]);
    if (prof !== void 0) this.applyProfile(prof);
    if (admin !== void 0) this.isAdmin = admin;
    if (school !== void 0) this.applySchool(school);
    this.listenState();
    try {
      await this.pullPrograms();
    } catch (e) {
      console.warn("programs", e);
    }
    this.saveCache();
    if (typeof ntLoad === "function") ntLoad(true);
  },
  /* ---------- kişisel verinin eşitlenmesi ---------- */
  outgoing() {
    const d = Object.assign({}, DB.d);
    delete d.ai;
    delete d.owner;
    return d;
  },
  async pullState() {
    const me = this.uid;
    if (!me) return;
    const { data, error } = await this.sb.from("user_state").select("data, updated_at").eq("user_id", me).maybeSingle();
    if (error) throw error;
    const local = DB.d, keep = { ai: local.ai };
    let push = false;
    if (local.owner && local.owner !== me) {
      DB.d = DB.normalize(data ? data.data : DB.blank());
    } else if (data && (data.data.mtime || 0) > (local.mtime || 0)) {
      DB.d = DB.normalize(data.data);
    } else if (local.onboarded) {
      push = true;
    }
    Object.assign(DB.d, keep);
    DB.d.owner = me;
    DB.persist();
    if (push) await this.push();
  },
  schedulePush(ms) {
    if (!this.uid) return;
    this.pending = true;
    clearTimeout(this.pushT);
    this.pushT = setTimeout(() => this.push(), ms == null ? 1500 : ms);
  },
  async push() {
    if (!this.uid) return;
    if (this.pushing) {
      this.pushAgain = true;
      return;
    }
    this.pushing = true;
    clearTimeout(this.pushT);
    this.pushT = null;
    try {
      const { error } = await this.sb.from("user_state").upsert({ user_id: this.uid, data: this.outgoing() });
      if (error) throw error;
      this.pending = false;
      await this.pushProfile();
    } catch (e) {
      this.pending = true;
    } finally {
      this.pushing = false;
      if (this.pushAgain) {
        this.pushAgain = false;
        this.schedulePush();
      }
    }
  },
  async flushPush() {
    if (this.pending || this.pushT) await this.push();
  },
  async refresh() {
    if (!this.uid || this.pending || this.pushing) return false;
    try {
      const { data } = await this.sb.from("user_state").select("data").eq("user_id", this.uid).maybeSingle();
      let changed = false;
      if (data && (data.data.mtime || 0) > (DB.d.mtime || 0)) {
        this.applyRemote(data.data);
        changed = true;
      }
      if (await this.pullPrograms()) changed = true;
      if (!this.isAdmin) {
        try {
          if (await this.rpc("is_app_admin")) {
            this.isAdmin = true;
            changed = true;
          }
        } catch (e) {
        }
      }
      return changed;
    } catch (e) {
      return false;
    }
  },
  /* ---------- profil (sınıf arkadaşları ve hocalar adını görür) ---------- */
  profileRow() {
    const p = DB.d.profile, g = p.goal || {}, t = p.kind === "teacher";
    return { name: (p.name || "").slice(0, 40), kind: t ? "teacher" : "student", branch: t ? String(p.branch || "").slice(0, 30) : "", grade: !t && GRADES.some((r) => r[0] === p.grade) ? p.grade : "", track: String(p.track || "SAY").toLowerCase(), goal: [g.school, g.dept].filter(Boolean).join(", ").slice(0, 80), palette: p.palette || "lavanta" };
  },
  async fetchProfile() {
    const { data, error } = await this.sb.from("profiles").select("*").eq("id", this.uid).maybeSingle();
    if (error) throw error;
    return data || null;
  },
  async loadProfile() {
    this.applyProfile(await this.fetchProfile());
  },
  applyProfile(data) {
    this.profile = data || null;
    if (data) {
      this.lastProfile = JSON.stringify({ name: data.name, kind: data.kind || "student", branch: data.branch || "", grade: data.grade || "", track: data.track, goal: data.goal, palette: data.palette });
      if (!DB.d.profile.kind && DB.d.onboarded && data.kind) {
        DB.d.profile.kind = data.kind;
        if (data.kind === "teacher") DB.d.profile.grade = "";
      }
      if (!DB.d.profile.branch && data.branch) DB.d.profile.branch = data.branch;
      if (data.name && (!DB.d.profile.name || !fullNameOk(DB.d.profile.name) && fullNameOk(data.name))) DB.d.profile.name = data.name;
      if (!DB.d.profile.grade && data.grade) DB.d.profile.grade = data.grade;
    }
  },
  async pushProfile() {
    if (!this.uid || !DB.d.onboarded) return;
    const row = this.profileRow(), js = JSON.stringify(row);
    if (js === this.lastProfile) return;
    const { error } = await this.sb.from("profiles").update(row).eq("id", this.uid);
    if (!error) {
      this.lastProfile = js;
      this.profile = Object.assign(this.profile || {}, row);
    }
  },
  googleName() {
    const m = this.user && this.user.user_metadata || {};
    return (m.full_name || m.name || "").split(" ")[0] || "";
  },
  /* ---------- dershane ---------- */
  async fetchSchool() {
    const { data, error } = await this.sb.from("memberships").select("institution_id, role, class_id, joined_at, inst:institutions(id, name), cls:classes(id, name)").eq("user_id", this.uid).order("joined_at");
    if (error) throw error;
    return data || [];
  },
  async loadSchool() {
    return this.applySchool(await this.fetchSchool());
  },
  applySchool(data) {
    this.school = data || [];
    if (this.anyStaff() && DB.d.profile.kind !== "teacher") {
      DB.d.profile.kind = "teacher";
      DB.d.profile.grade = "";
      DB.save();
    } else if (!this.anyStaff() && DB.d.profile.kind === "teacher" && this.profile && this.profile.kind === "student" && this.school.some((m) => m.role === "student")) {
      DB.d.profile.kind = "student";
      DB.save();
      if (typeof ui !== "undefined") ui.nudged = false;
    }
    return this.school;
  },
  async rpc(fn, args) {
    const { data, error } = await this.sb.rpc(fn, args || {});
    if (error) throw error;
    return data;
  },
  async joinCode(code) {
    const r = await this.rpc("join_with_code", { p_code: code });
    try {
      await this.loadProfile();
    } catch (e) {
    }
    await this.loadSchool();
    await this.pullPrograms();
    this.saveCache();
    return r;
  },
  /* ---------- hocanın yüklediği programlar (öğrenci tarafı) ---------- */
  async pullPrograms() {
    const studentOf = new Set(this.school.filter((m) => m.role === "student").map((m) => m.institution_id));
    const since = wkKey(addDays(fromKey(thisWeek()), -21));
    let progs = [];
    if (studentOf.size) {
      const { data, error } = await this.sb.from("programs").select("id, institution_id, week_start, title, tasks, updated_at").in("institution_id", Array.from(studentOf)).gte("week_start", since).order("created_at");
      if (error) throw error;
      progs = data || [];
    }
    const remote = {};
    if (progs.length) {
      const { data } = await this.sb.from("program_progress").select("program_id, done").eq("user_id", this.uid).in("program_id", progs.map((p) => p.id));
      (data || []).forEach((r) => {
        remote[r.program_id] = r.done || {};
      });
    }
    const sig = JSON.stringify(progs.map((p) => [p.id, p.updated_at])) + JSON.stringify(remote);
    const ids = new Set(progs.map((p) => p.id));
    let changed = false;
    Object.keys(DB.d.weeks).forEach((wk) => {
      if (wk < since) return;
      const w = DB.d.weeks[wk], before = w.tasks.length;
      w.tasks = w.tasks.filter((t) => t.src !== "dershane" || ids.has(t.pid));
      if (w.tasks.length !== before) changed = true;
    });
    progs.forEach((p) => {
      const wk = wkKey(mondayOf(fromKey(p.week_start))), w = DB.ensureWeek(wk);
      const inst = (this.member(p.institution_id) || {}).inst || {};
      const old = {};
      w.tasks.filter((t) => t.pid === p.id).forEach((t) => {
        old[t.pi] = t;
      });
      const done = remote[p.id] || {};
      const fresh = (p.tasks || []).map((t, i) => {
        const o = old[i];
        const isDone = o ? !!o.done : !!done[i];
        return {
          id: "d" + p.id.slice(0, 8) + "-" + i,
          pid: p.id,
          pi: i,
          src: "dershane",
          school: inst.name || "",
          day: Math.max(0, Math.min(6, Number(t.day) || 0)),
          text: String(t.text || ""),
          label: String(t.label || t.text || ""),
          type: t.type || guessTask(String(t.text || "")).type,
          subject: t.subject || "",
          topic: t.topic || "",
          done: isDone,
          doneOn: o ? o.doneOn : typeof done[i] === "string" ? done[i] : void 0
        };
      });
      const before = JSON.stringify(w.tasks.filter((t) => t.pid === p.id));
      w.tasks = w.tasks.filter((t) => t.pid !== p.id).concat(fresh);
      if (p.title && !w.label) w.label = p.title;
      if (before !== JSON.stringify(fresh)) changed = true;
    });
    if (changed) {
      DB.persist();
    }
    this.progSig = sig;
    return changed;
  },
  queueProgress(pid) {
    clearTimeout(this.progT[pid]);
    this.progT[pid] = setTimeout(() => this.pushProgress(pid), 900);
  },
  async pushProgress(pid) {
    const done = {};
    Object.values(DB.d.weeks).forEach((w) => w.tasks.forEach((t) => {
      if (t.pid === pid && t.done) done[t.pi] = t.doneOn || dayKey();
    }));
    try {
      await this.sb.from("program_progress").upsert({ program_id: pid, user_id: this.uid, done });
    } catch (e) {
    }
  }
};
Cloud.init();
