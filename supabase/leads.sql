-- Leads table cleanup for canonical payload-first storage.
-- Run this in Supabase SQL editor.

alter table if exists public.leads
  add column if not exists email text;

alter table if exists public.leads
  add column if not exists name text;

alter table if exists public.leads
  add column if not exists payload jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'leads'
  ) then
    update public.leads
    set payload = case
      when jsonb_typeof(payload) = 'object' then payload
      else '{}'::jsonb
    end
    where payload is null
       or jsonb_typeof(payload) <> 'object';

    update public.leads
    set email = lower(
      coalesce(
        nullif(btrim(email), ''),
        nullif(
          btrim(
            case
              when jsonb_typeof(payload->'contact') = 'object'
                then payload->'contact'->>'email'
              else null
            end
          ),
          ''
        )
      )
    )
    where email is null
       or btrim(email) = '';

    update public.leads
    set name = coalesce(
      nullif(btrim(name), ''),
      nullif(
        btrim(
          case
            when jsonb_typeof(payload->'contact') = 'object'
              then payload->'contact'->>'name'
            else null
          end
        ),
        ''
      ),
      nullif(
        btrim(
          case
            when jsonb_typeof(payload->'contact') = 'object'
              then payload->'contact'->>'first_name'
            else null
          end
        ),
        ''
      ),
      'there'
    )
    where name is null
       or btrim(name) = '';

    with prepared as (
      select
        l.ctid,
        l.email,
        l.name,
        case
          when jsonb_typeof(l.payload) = 'object' then l.payload
          else '{}'::jsonb
        end as payload_obj
      from public.leads l
    ),
    resolved as (
      select
        p.ctid,
        p.email,
        p.name,
        p.payload_obj,
        case
          when jsonb_typeof(p.payload_obj->'contact') = 'object'
            then p.payload_obj->'contact'
          else '{}'::jsonb
        end as contact_obj,
        case
          when jsonb_typeof(p.payload_obj->'meta') = 'object'
            then p.payload_obj->'meta'
          else '{}'::jsonb
        end as meta_obj,
        case
          when jsonb_typeof(p.payload_obj->'location') = 'object'
            then p.payload_obj->'location'
          else '{}'::jsonb
        end as location_obj,
        case
          when jsonb_typeof(p.payload_obj->'answers') = 'object'
            then p.payload_obj->'answers'
          else '{}'::jsonb
        end as answers_obj,
        case
          when jsonb_typeof(p.payload_obj->'outcomes') = 'object'
            then p.payload_obj->'outcomes'
          else '{}'::jsonb
        end as outcomes_obj
      from prepared p
    ),
    enriched as (
      select
        r.ctid,
        r.payload_obj,
        r.answers_obj,
        r.outcomes_obj,
        r.contact_obj,
        r.meta_obj,
        r.location_obj,
        case
          when jsonb_typeof(r.outcomes_obj->'lead') = 'object'
            then r.outcomes_obj->'lead'
          else '{}'::jsonb
        end as lead_obj,
        case
          when jsonb_typeof(r.outcomes_obj->'safety') = 'object'
            then r.outcomes_obj->'safety'
          else '{}'::jsonb
        end as safety_obj,
        case
          when jsonb_typeof(r.outcomes_obj->'priority') = 'object'
            then r.outcomes_obj->'priority'
          else '{}'::jsonb
        end as priority_obj,
        case
          when jsonb_typeof(r.outcomes_obj->'emergency') = 'object'
            then r.outcomes_obj->'emergency'
          else '{}'::jsonb
        end as emergency_obj,
        case
          when jsonb_typeof(r.outcomes_obj->'camera_plan') = 'object'
            then r.outcomes_obj->'camera_plan'
          else '{}'::jsonb
        end as camera_plan_obj,
        coalesce(
          nullif(btrim(r.meta_obj->>'source'), ''),
          nullif(btrim(r.payload_obj->>'source'), ''),
          'website'
        ) as resolved_source,
        coalesce(
          case
            when jsonb_typeof(r.meta_obj->'has_bonus') = 'boolean'
              then (r.meta_obj->>'has_bonus')::boolean
            else null
          end,
          case
            when jsonb_typeof(r.payload_obj->'has_bonus') = 'boolean'
              then (r.payload_obj->>'has_bonus')::boolean
            else null
          end,
          false
        ) as resolved_has_bonus,
        lower(
          coalesce(
            nullif(btrim(r.contact_obj->>'email'), ''),
            nullif(btrim(r.email), ''),
            ''
          )
        ) as resolved_contact_email,
        coalesce(
          nullif(btrim(r.contact_obj->>'name'), ''),
          nullif(btrim(r.contact_obj->>'first_name'), ''),
          nullif(btrim(r.name), ''),
          'there'
        ) as resolved_contact_name,
        nullif(btrim(r.contact_obj->>'mobile'), '') as resolved_contact_mobile,
        case
          when jsonb_typeof(r.outcomes_obj->'lead') = 'object'
           and jsonb_typeof(r.outcomes_obj->'lead'->'score') = 'number'
            then greatest(
              0,
              least(100, round((r.outcomes_obj->'lead'->>'score')::numeric))
            )::int
          else null
        end as resolved_lead_score,
        nullif(
          btrim(
            case
              when jsonb_typeof(r.outcomes_obj->'lead') = 'object'
                then r.outcomes_obj->'lead'->>'tier'
              else null
            end
          ),
          ''
        ) as resolved_lead_tier_raw,
        nullif(
          btrim(
            case
              when jsonb_typeof(r.outcomes_obj->'lead') = 'object'
                then r.outcomes_obj->'lead'->>'model_version'
              else null
            end
          ),
          ''
        ) as resolved_model_version,
        case
          when jsonb_typeof(r.outcomes_obj->'safety') = 'object'
           and jsonb_typeof(r.outcomes_obj->'safety'->'total') = 'number'
            then greatest(
              0,
              least(100, round((r.outcomes_obj->'safety'->>'total')::numeric))
            )::int
          else null
        end as resolved_safety_total,
        case
          when jsonb_typeof(r.outcomes_obj->'safety') = 'object'
           and jsonb_typeof(r.outcomes_obj->'safety'->'max') = 'number'
            then greatest(0, round((r.outcomes_obj->'safety'->>'max')::numeric))::int
          else null
        end as resolved_safety_max_raw,
        case
          when jsonb_typeof(r.outcomes_obj->'safety') = 'object'
           and jsonb_typeof(r.outcomes_obj->'safety'->'emergency_readiness_score') = 'number'
            then greatest(
              0,
              least(
                100,
                round((r.outcomes_obj->'safety'->>'emergency_readiness_score')::numeric)
              )
            )::int
          else null
        end as resolved_emergency_readiness_score,
        case
          when jsonb_typeof(r.outcomes_obj->'panatag_home_rating') = 'number'
            then greatest(
              0,
              least(100, round((r.outcomes_obj->>'panatag_home_rating')::numeric))
            )::int
          else null
        end as resolved_panatag_home_rating,
        case
          when jsonb_typeof(r.outcomes_obj->'camera_plan') = 'object'
           and jsonb_typeof(r.outcomes_obj->'camera_plan'->'camera_count') = 'number'
            then greatest(
              0,
              round((r.outcomes_obj->'camera_plan'->>'camera_count')::numeric)
            )::int
          else null
        end as resolved_camera_count,
        case
          when jsonb_typeof(r.outcomes_obj->'camera_plan') = 'object'
           and jsonb_typeof(r.outcomes_obj->'camera_plan'->'nvr_channel') = 'number'
            then greatest(
              0,
              round((r.outcomes_obj->'camera_plan'->>'nvr_channel')::numeric)
            )::int
          else null
        end as resolved_nvr_channel,
        case
          when jsonb_typeof(r.outcomes_obj->'camera_plan') = 'object'
           and jsonb_typeof(r.outcomes_obj->'camera_plan'->'storage_recommended_tb') = 'number'
            then greatest(
              0,
              round((r.outcomes_obj->'camera_plan'->>'storage_recommended_tb')::numeric)
            )::int
          else null
        end as resolved_storage_recommended_tb,
        case
          when jsonb_typeof(r.outcomes_obj->'camera_plan') = 'object'
           and jsonb_typeof(r.outcomes_obj->'camera_plan'->'storage_estimated_tb_7d') = 'number'
            then round(
              (r.outcomes_obj->'camera_plan'->>'storage_estimated_tb_7d')::numeric,
              3
            )
          else null
        end as resolved_storage_estimated_tb_7d
      from resolved r
    ),
    derived as (
      select
        e.*,
        case
          when e.resolved_lead_tier_raw in ('Hot', 'Warm', 'Nurture')
            then e.resolved_lead_tier_raw
          when e.resolved_lead_score is null
            then null
          when e.resolved_lead_score >= 70
            then 'Hot'
          when e.resolved_lead_score >= 50
            then 'Warm'
          else 'Nurture'
        end as resolved_lead_tier,
        coalesce(
          e.resolved_safety_max_raw,
          case
            when e.resolved_safety_total is not null then 100
            else null
          end
        ) as resolved_safety_max,
        (
          case
            when e.resolved_safety_total is null
              then '{}'::jsonb
            when e.resolved_safety_total >= 70
              then jsonb_build_object(
                'label', 'Almost',
                'range', '70-100',
                'severity', 'low'
              )
            when e.resolved_safety_total >= 45
              then jsonb_build_object(
                'label', 'Improve',
                'range', '45-69',
                'severity', 'medium'
              )
            else jsonb_build_object(
              'label', 'Urgent',
              'range', '0-44',
              'severity', 'high'
            )
          end
          || case
            when jsonb_typeof(e.safety_obj->'level') = 'object'
              then e.safety_obj->'level'
            else '{}'::jsonb
          end
        ) as resolved_safety_level,
        (
          case
            when (
              case
                when e.resolved_lead_tier_raw in ('Hot', 'Warm', 'Nurture')
                  then e.resolved_lead_tier_raw
                when e.resolved_lead_score is null
                  then null
                when e.resolved_lead_score >= 70
                  then 'Hot'
                when e.resolved_lead_score >= 50
                  then 'Warm'
                else 'Nurture'
              end
            ) = 'Hot'
              then jsonb_build_object('label', 'Urgent', 'severity', 'high')
            when (
              case
                when e.resolved_lead_tier_raw in ('Hot', 'Warm', 'Nurture')
                  then e.resolved_lead_tier_raw
                when e.resolved_lead_score is null
                  then null
                when e.resolved_lead_score >= 70
                  then 'Hot'
                when e.resolved_lead_score >= 50
                  then 'Warm'
                else 'Nurture'
              end
            ) = 'Warm'
              then jsonb_build_object('label', 'Improve', 'severity', 'medium')
            when (
              case
                when e.resolved_lead_tier_raw in ('Hot', 'Warm', 'Nurture')
                  then e.resolved_lead_tier_raw
                when e.resolved_lead_score is null
                  then null
                when e.resolved_lead_score >= 70
                  then 'Hot'
                when e.resolved_lead_score >= 50
                  then 'Warm'
                else 'Nurture'
              end
            ) = 'Nurture'
              then jsonb_build_object('label', 'Almost', 'severity', 'low')
            else '{}'::jsonb
          end
          || e.priority_obj
        ) as resolved_priority,
        (
          case
            when e.resolved_emergency_readiness_score is null
              then '{}'::jsonb
            when e.resolved_emergency_readiness_score >= 100
              then jsonb_build_object('label', 'Almost', 'severity', 'low')
            when e.resolved_emergency_readiness_score >= 40
              then jsonb_build_object('label', 'Improve', 'severity', 'medium')
            else jsonb_build_object('label', 'Urgent', 'severity', 'high')
          end
          || e.emergency_obj
        ) as resolved_emergency,
        (
          case
            when jsonb_typeof(e.safety_obj->'categories') = 'object'
              then e.safety_obj->'categories'
            else '{}'::jsonb
          end
          || jsonb_build_object(
            'home_entrance', to_jsonb(
              case
                when jsonb_typeof(e.safety_obj->'categories'->'home_entrance') = 'number'
                  then greatest(
                    0,
                    least(
                      100,
                      round((e.safety_obj->'categories'->>'home_entrance')::numeric)
                    )
                  )::int
                else null
              end
            ),
            'neighborhood_safety_check', to_jsonb(
              case
                when jsonb_typeof(e.safety_obj->'categories'->'neighborhood_safety_check') = 'number'
                  then greatest(
                    0,
                    least(
                      100,
                      round((e.safety_obj->'categories'->>'neighborhood_safety_check')::numeric)
                    )
                  )::int
                else null
              end
            ),
            'windows_terrace', to_jsonb(
              case
                when jsonb_typeof(e.safety_obj->'categories'->'windows_terrace') = 'number'
                  then greatest(
                    0,
                    least(
                      100,
                      round((e.safety_obj->'categories'->>'windows_terrace')::numeric)
                    )
                  )::int
                else null
              end
            ),
            'emergency_readiness_home', to_jsonb(
              case
                when jsonb_typeof(e.safety_obj->'categories'->'emergency_readiness_home') = 'number'
                  then greatest(
                    0,
                    least(
                      100,
                      round((e.safety_obj->'categories'->>'emergency_readiness_home')::numeric)
                    )
                  )::int
                else null
              end
            )
          )
        ) as resolved_safety_categories,
        (
          (e.contact_obj - 'first_name')
          || jsonb_build_object(
            'name', to_jsonb(e.resolved_contact_name),
            'email', to_jsonb(e.resolved_contact_email),
            'mobile', to_jsonb(e.resolved_contact_mobile)
          )
        ) as resolved_contact,
        (
          e.meta_obj
          || jsonb_build_object(
            'source', to_jsonb(e.resolved_source),
            'utm_source', to_jsonb(
              coalesce(nullif(btrim(e.meta_obj->>'utm_source'), ''), '')
            ),
            'utm_medium', to_jsonb(
              coalesce(nullif(btrim(e.meta_obj->>'utm_medium'), ''), '')
            ),
            'utm_campaign', to_jsonb(
              coalesce(nullif(btrim(e.meta_obj->>'utm_campaign'), ''), '')
            ),
            'allow_external_emails', to_jsonb(
              case
                when jsonb_typeof(e.meta_obj->'allow_external_emails') = 'boolean'
                  then (e.meta_obj->>'allow_external_emails')::boolean
                else null
              end
            ),
            'has_bonus', to_jsonb(e.resolved_has_bonus)
          )
        ) as resolved_meta,
        (
          e.location_obj
          || jsonb_build_object(
            'source', to_jsonb(
              case
                when e.location_obj->>'source' = 'ip_header'
                  then 'ip_header'
                else 'unavailable'
              end
            ),
            'country_code', to_jsonb(nullif(btrim(e.location_obj->>'country_code'), '')),
            'region', to_jsonb(nullif(btrim(e.location_obj->>'region'), '')),
            'city', to_jsonb(nullif(btrim(e.location_obj->>'city'), ''))
          )
        ) as resolved_location,
        (
          e.camera_plan_obj
          || jsonb_build_object(
            'camera_count', to_jsonb(e.resolved_camera_count),
            'nvr_channel', to_jsonb(e.resolved_nvr_channel),
            'storage_recommended_tb', to_jsonb(e.resolved_storage_recommended_tb),
            'storage_estimated_tb_7d', to_jsonb(e.resolved_storage_estimated_tb_7d)
          )
        ) as resolved_camera_plan
      from enriched e
    ),
    normalized as (
      select
        d.ctid,
        d.payload_obj
          || jsonb_build_object(
            'schema_version', 2,
            'source', d.resolved_source,
            'has_bonus', d.resolved_has_bonus,
            'contact', d.resolved_contact,
            'answers', d.answers_obj,
            'meta', d.resolved_meta,
            'location', d.resolved_location,
            'outcomes',
              d.outcomes_obj
              || jsonb_build_object(
                'lead',
                  d.lead_obj
                  || jsonb_build_object(
                    'score', to_jsonb(d.resolved_lead_score),
                    'tier', to_jsonb(d.resolved_lead_tier),
                    'model_version', to_jsonb(d.resolved_model_version),
                    'breakdown',
                      case
                        when jsonb_typeof(d.lead_obj->'breakdown') = 'array'
                          then d.lead_obj->'breakdown'
                        else '[]'::jsonb
                      end
                  ),
                'safety',
                  d.safety_obj
                  || jsonb_build_object(
                    'total', to_jsonb(d.resolved_safety_total),
                    'max', to_jsonb(d.resolved_safety_max),
                    'level', d.resolved_safety_level,
                    'emergency_readiness_score',
                      to_jsonb(d.resolved_emergency_readiness_score),
                    'categories', d.resolved_safety_categories
                  ),
                'priority', d.resolved_priority,
                'emergency', d.resolved_emergency,
                'panatag_home_rating', to_jsonb(d.resolved_panatag_home_rating),
                'camera_plan', d.resolved_camera_plan,
                'recommendations',
                  case
                    when jsonb_typeof(d.outcomes_obj->'recommendations') = 'array'
                      then d.outcomes_obj->'recommendations'
                    else '[]'::jsonb
                  end
              )
          ) as next_payload
      from derived d
    )
    update public.leads l
    set payload = normalized.next_payload
    from normalized
    where l.ctid = normalized.ctid;
  end if;
end
$$;
